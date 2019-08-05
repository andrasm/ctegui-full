const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
var cors = require("cors");
app.use(cors());

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

const controlAlgo = (algoName, newState) => {
  for (let index = 0; index < algosTestData.length; index++) {
    const element = algosTestData[index];
    if (element.name === algoName) {
      algosTestData[index].state = newState;
      console.log(`Changing algo state of ${algoName} to ${newState}`);
      break;
    }
  }
};

const controlProduct = (algoName, productId, newState) => {
  const productIdInt = Number(productId);
  for (let index = 0; index < algosTestData.length; index++) {
    const element = algosTestData[index];
    if (element.name === algoName) {
      for (let j = 0; j < element.products.length; j++) {
        const product = element.products[j];

        if (product.id === productIdInt) {
          element.products[j].state = newState;
          console.log(
            `Changing product state of ${algoName}/${productId} to ${newState}`
          );
          break;
        }
      }
      break;
    }
  }
};

app.post("/algos/:name/stop", (req, res) => {
  const algoName = req.params.name;
  controlAlgo(algoName, "Stopped");
  res.send({});
});

app.post("/algos/:name/pause", (req, res) => {
  const algoName = req.params.name;
  controlAlgo(algoName, "Paused");
  res.send({});
});

app.post("/algos/:name/unpause", (req, res) => {
  const algoName = req.params.name;
  controlAlgo(algoName, "Running");
  res.send({});
});

app.post("/algos/:name/:productId/unpause", (req, res) => {
  const algoName = req.params.name;
  const productId = req.params.productId;
  controlProduct(algoName, productId, "Running");
  res.send({});
});

app.post("/algos/:name/:productId/pause", (req, res) => {
  const algoName = req.params.name;
  const productId = req.params.productId;
  controlProduct(algoName, productId, "Paused");
  res.send({});
});

let algosTestData = [
  {
    name: "LSE_0",
    state: "Paused",
    products: [
      {
        id: 1,
        ric: "VOD.L",
        state: "Running",
        message: "",
        orders: 0,
        trades: 0
      }
    ]
  },
  {
    name: "LSE_1",
    state: "Running",
    products: [
      {
        id: 2,
        ric: "TSCO.L",
        state: "Running",
        message: "Trading",
        orders: 1,
        trades: 14
      },
      {
        id: 3,
        ric: "BP.L",
        state: "Paused",
        message: "Some problem",
        orders: 0,
        trades: 0
      }
    ]
  }
];

// create a GET route
app.get("/algos", (req, res) => {
  console.log("serving request algos");
  res.send(algosTestData);
});

setInterval(() => {
  for (let i = 0; i < algosTestData.length; i++) {
    if (algosTestData[i].state === "Running") {
      for (let j = 0; j < algosTestData[i].products.length; j++) {
        const product = algosTestData[i].products[j];
        if (product.state === "Running") {
          if (Math.random() > 0.7) {
            product.orders += 1;
          }

          if (Math.random() > 0.8) {
            product.trades += 1;
          }
        }
      }
    }
  }
}, 1000);
