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
   convert instance count to compute units (below)

Instance size	Normalization factor
nano	0.25
micro	0.5
small	1
medium	2
large	4
xlarge	8
2xlarge	16
3xlarge	24
4xlarge	32
6xlarge	48
8xlarge	64
9xlarge	72
10xlarge	80
12xlarge	96
16xlarge	128
18xlarge	144
24xlarge	192
32xlarge	256
56xlarge	448
112xlarge	896
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
