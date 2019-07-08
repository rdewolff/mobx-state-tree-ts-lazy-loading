import * as React from "react";
import { render } from "react-dom";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import "./styles.css";

@observer
class App extends React.Component<
  {
    store: any;
  },
  {}
> {
  store: any;

  constructor(props) {
    super(props);
    this.store = props.store;
  }
  render() {
    // const { store } = props
    const store = this.store;
    return (
      <div className="App">
        <h1>Mobx State Tree</h1>
        <h3>Stores</h3>
        <div>Business: {store.businesses[0].name}</div>
        <pre>
          {store.businesses[0].owner.map(owner => owner.name + "\n")}
          {/* {store.people[0].phone} */}
          {/* {store.people[0].favorites[0].name} */}
          {/* {store.people[0].favorites[1].name} */}
        </pre>
        <br />
        <button onClick={() => store.businesses[0].addPerson()}>
          lazy load
        </button>
      </div>
    );
  }
}

const Business = types
  .model({
    _id: types.identifier,
    name: "",
    owner: types.array(types.late(() => LazyPeople))
  })
  .actions(self => ({
    addPerson() {
      console.log("Business.addPerson()");
      self.owner.push(3);
      console.log(self.owner);
    }
  }));

// https://swapi.co/api/people/
const People = types.model({
  _id: types.identifier,
  name: ""
  // favorites: types.array(types.reference(types.late(() => Business)))
});

function getPeople(id) {
  const url = "https://swapi.co/api/people/" + id + "/";
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  return JSON.parse(req.responseText) || null;
}

const LazyPeople = types.maybeNull(
  types.reference(People, {
    get(identifier, parent) {
      // return getPeople(identifier);
      console.log("LazyPeople.get()");
      // dynamic data loading - works 🎉
      return getPeople(identifier);
      // static data loading - works 🎉
      // return {
      //   _id: "1",
      //   name: "Jobano"
      // };
    },
    set(value /* user */) {
      return value ? value._id : null;
    }
  })
);

const RootStore = types.model({
  businesses: types.array(Business),
  people: types.array(People)
});

const rootStore = RootStore.create({
  businesses: [{ _id: "b-1", name: "Meetme", owner: ["1", "2"] }],
  people: [] // we want this to lazy load when required
  // users: [{ _id: "100", phone: "555-1234", favorites: ["1", "2"] }]
});

const rootElement = document.getElementById("root");
render(<App store={rootStore} />, rootElement);
