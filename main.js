const express = require("express");
const Prometheus = require("prom-client");

const metric = new Prometheus.Gauge({
  name: "ec2_instance_family_cmopute_units",
  help: "EC2 instance family compute units",
  labelNames: ["family"],
});

const app = express();

app.get("/metrics", async function (req, res) {
  /*
   make a request ot AWS to get the actual count of instances  using the AWS nodejs SDK
   convert instance count to compute units (see the README.md file)
*/

  metric.labels({ family: "m4" }).set(88); // mocked up
  metric.labels({ family: "t2" }).set(42); // mocked up
  metric.labels({ family: "" }).set(42); // mocked up

  res.set("Content-Type", Prometheus.register.contentType);
  const d = await Prometheus.register.metrics();
  res.end(d);
  metric.reset();
});

app.listen(3000);
