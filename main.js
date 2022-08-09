const express = require("express");
const Prometheus = require("prom-client");
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

const { INSTANCE_SIZE_NORMALIZATION_DATA } = require('./instance-size-normalization');

const ec2Client = new EC2Client({ region: 'us-east-2' });
const metric = new Prometheus.Gauge({
  name: "ec2_instance_family_cmopute_units",
  help: "EC2 instance family compute units",
  labelNames: ["family"],
});

const app = express();

app.get("/metrics", async function (req, res) {
  const describeCommand = new DescribeInstancesCommand({})
  const describeResults = await ec2Client.send(describeCommand);

  const grouped = describeResults.Reservations.reduce((acc, reservation) => {
    const instances = reservation.Instances || [];

    instances.forEach(i => {
      const instanceType = i.InstanceType;
      const instanceState = i.State.Name;
      const [family, size] = instanceType.split('.');
      acc.debug.push({
        state: instanceState,
        keyName: i.KeyName,
        instanceType
      });

      if (instanceState === 'stopped') {
        return;
      }

      if (!(family in acc.counts)) {
        acc.counts[family] = {
          familyCount: 0
        };
      }
      acc.counts[family].familyCount += 1;

      if (!(size in acc.counts[family])) {
        acc.counts[family][size] = 0;
      }
      acc.counts[family][size] += 1;
    });

    return acc;
  }, { counts: {}, debug: [] });

  const values = Object.entries(grouped.counts).reduce((acc, [familyKey, data]) => {
    Object.keys(data).forEach((dataKey) => {
      if (dataKey === 'familyCount') {
        return;
      }

      if (!(familyKey in acc)) {
        acc[familyKey] = 0;
      }
      const normalized = INSTANCE_SIZE_NORMALIZATION_DATA[dataKey] * data[dataKey];
      acc[familyKey] += normalized;
    });

    return acc;
  }, {});


  console.log(grouped, values);

  Object.entries(values).forEach(([familyKey, computeUnits]) => {
    metric.labels({ family: familyKey }).set(computeUnits);
  });

  res.set("Content-Type", Prometheus.register.contentType);
  const d = await Prometheus.register.metrics();
  res.end(d);
  metric.reset();
});

app.listen(3000);
