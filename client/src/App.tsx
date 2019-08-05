import React, { useState, useEffect, useRef } from "react";

import "./App.css";

const axios = require("axios");

enum AlgoState {
  Uninited = "Uninited",
  Inited = "Inited",
  Paused = "Paused",
  Running = "Running",
  Stopped = "Stopped"
}

enum ProductState {
  Paused = "Paused",
  Running = "Running"
}

interface AlgoProduct {
  readonly ric: string;
  readonly id: number;
  readonly state: ProductState;
  readonly message: string;
  readonly orders: number;
  readonly trades: number;
}

interface Algo {
  readonly name: string;
  state: AlgoState;
  products: AlgoProduct[];
}

interface AlgoFunc {
  (algoName: string): void;
}

interface ProductFunc {
  (algoName: string, productId: number): void;
}

interface StopAlgoFunc extends AlgoFunc {}
interface PauseAlgoFunc extends AlgoFunc {}
interface UnpauseAlgoFunc extends AlgoFunc {}

interface PauseProductFunc extends ProductFunc {}
interface UnpauseProductFunc extends ProductFunc {}

interface AlgoController {
  stopAlgo: StopAlgoFunc;
  pauseAlgo: PauseAlgoFunc;
  unpauseAlgo: UnpauseAlgoFunc;
  pauseProduct: PauseProductFunc;
  unpauseProduct: UnpauseProductFunc;
}

const dummyAlgoController = {
  stopAlgo: (algoName: string) => {
    console.log("stopAlgo", algoName);
  },
  pauseAlgo: (algoName: string) => {
    console.log("pauseAlgo", algoName);
  },
  unpauseAlgo: (algoName: string) => {
    console.log("unpauseAlgo", algoName);
  },
  pauseProduct: (algoName: string, productId: number) => {
    console.log("pauseProduct", algoName, productId);
  },
  unpauseProduct: (algoName: string, productId: number) => {
    console.log("unpauseProduct", algoName, productId);
  }
};

const serverBaseAddress = "http://localhost:5000";

const realAlgoController = {
  stopAlgo: (algoName: string) => {
    console.log("stopAlgo", algoName);
    axios.post(`${serverBaseAddress}/algos/${algoName}/stop`, {});
  },
  pauseAlgo: (algoName: string) => {
    console.log("pauseAlgo", algoName);
    axios.post(`${serverBaseAddress}/algos/${algoName}/pause`, {});
  },
  unpauseAlgo: (algoName: string) => {
    console.log("unpauseAlgo", algoName);
    axios.post(`${serverBaseAddress}/algos/${algoName}/unpause`, {});
  },
  pauseProduct: (algoName: string, productId: number) => {
    console.log("pauseProduct", algoName, productId);
    axios.post(`${serverBaseAddress}/algos/${algoName}/${productId}/pause`, {});
  },
  unpauseProduct: (algoName: string, productId: number) => {
    console.log("unpauseProduct", algoName, productId);
    axios.post(
      `${serverBaseAddress}/algos/${algoName}/${productId}/unpause`,
      {}
    );
  }
};

const AlgoDisplay = (props: { algo: Algo; controller: AlgoController }) => {
  let buttons: [string, any][] = [];

  const addButton = (caption: string, action: Function) => {
    buttons.push([caption, () => action(props.algo.name)]);
  };

  if (props.algo.state !== AlgoState.Stopped) {
    addButton("Stop", props.controller.stopAlgo);
  }
  if (props.algo.state === AlgoState.Paused) {
    addButton("Unpause", props.controller.unpauseAlgo);
  }
  if (props.algo.state === AlgoState.Running) {
    addButton("Pause", props.controller.pauseAlgo);
  }

  return (
    <div className="algoInList">
      <div className="algoName">{props.algo.name}</div>
      <div className="algoState">{props.algo.state}</div>
      <div>
        {buttons.map(args => {
          const [caption, action] = args;
          return <button onClick={action}>{caption}</button>;
        })}
      </div>

      <div className="productList">
        {props.algo.products.map(product => (
          <ProductDisplay
            key={product.ric}
            product={product}
            controller={props.controller}
            algo={props.algo.name}
          />
        ))}
      </div>
    </div>
  );
};

const ProductDisplay = (props: {
  product: AlgoProduct;
  controller: AlgoController;
  algo: string;
}) => {
  const [buttonCaption, buttonAction] =
    props.product.state === ProductState.Paused
      ? ["Unpause", props.controller.unpauseProduct]
      : ["Pause", props.controller.pauseProduct];

  return (
    <div>
      <div className="productRic">{props.product.ric}</div>
      <div className="productState">{props.product.state}</div>
      <div className="productMessage">{props.product.message}</div>
      <button onClick={() => buttonAction(props.algo, props.product.id)}>
        {buttonCaption}
      </button>
    </div>
  );
};

const AlgoList = (props: { algos: Algo[]; controller: AlgoController }) => (
  <>
    {props.algos.map(algo => (
      <AlgoDisplay key={algo.name} algo={algo} controller={props.controller} />
    ))}
  </>
);

const algosTestData: Algo[] = [
  {
    name: "LSE_0",
    state: AlgoState.Paused,
    products: [
      {
        id: 1,
        ric: "VOD.L",
        state: ProductState.Running,
        message: "",
        orders: 0,
        trades: 0
      }
    ]
  },
  {
    name: "LSE_1",
    state: AlgoState.Running,
    products: [
      {
        id: 2,
        ric: "TSCO.L",
        state: ProductState.Running,
        message: "Trading",
        orders: 1,
        trades: 14
      },
      {
        id: 3,
        ric: "BP.L",
        state: ProductState.Paused,
        message: "Some problem",
        orders: 0,
        trades: 0
      }
    ]
  }
];

// taken from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback: any, delay: number) {
  const savedCallback = useRef<any>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

async function fetchAlgos(): Promise<Algo[]> {
  console.log("fetching algos");
  const response = await fetch("http://localhost:5000/algos");
  const body = await response.json();

  if (response.status !== 200) {
    throw Error(body.message);
  }
  return body;
}

const App: React.FC = () => {
  const [algos, setAlgos] = useState<Algo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchAlgos();
      setAlgos(result);
    };

    fetchData();
  }, []);

  useInterval(async () => {
    setAlgos(await fetchAlgos());
  }, 3000);

  return (
    <div className="App">
      <AlgoList algos={algos} controller={realAlgoController} />
    </div>
  );
};

export default App;
