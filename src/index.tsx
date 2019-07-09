import * as React from "react";
import { render } from "react-dom";
import { observer } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

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
          {store.businesses[0].owner.map(owner => (
            <User user={owner} />
          ))}
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

function User(props) {
  return <div>{props.user.name}</div>;
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
      // add a random person
      self.owner.push((Math.floor(Math.random() * 10) + 1).toString());
      console.log(JSON.stringify(self.owner));
    }
  }));

// https://swapi.co/api/people/
const People = types.model({
  _id: types.identifier,
  name: ""
  // favorites: types.array(types.reference(types.late(() => Business)))
});

// caching mechanism
const CachePeople = types.model().actions(self => {
  // stores the cache in the following format
  // id :
  // date :
  // value :
  let cache = {};
  const duration = 10000; // ms
  const save = identifier => {
    cache[identifier] = {
      value: getPeople(identifier),
      date: new Date()
    };
  };
  const get = (identifier: string) => {
    // check cache entry
    if (cache[identifier]) {
      const cached = cache[identifier];
      if (new Date() - cached.date < duration) {
        console.log("from cache");
        return cached.value;
      }
    }
    // otherwise we load it and cache it
    console.log("load");
    self.save(identifier);

    return cache[identifier].value;
  };

  return {
    get,
    save
  };
});

function getPeople(id) {
  const url = "https://swapi.co/api/people/" + id + "/";
  // const url = "http://localhost:3000/employees/" + id + "/";
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  return JSON.parse(req.responseText) || null;
}

const LazyPeople = types.maybeNull(
  types.reference(People, {
    get(identifier, parent) {
      // return getPeople(identifier);
      //console.log("LazyPeople.get()");
      // dynamic data loading - works 🎉
      // return getPeople(identifier);
      // dynamic data loading with cache - WIP
      return getRoot(parent).cache.get(identifier);
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
  people: types.array(People),
  cache: CachePeople
});

const rootStore = RootStore.create({
  businesses: [{ _id: "b-1", name: "Meetme", owner: ["1", "2"] }],
  people: [], // we want this to lazy load when required
  cache: {}
  // users: [{ _id: "100", phone: "555-1234", favorites: ["1", "2"] }]
});

const rootElement = document.getElementById("root");
render(<App store={rootStore} />, rootElement);
