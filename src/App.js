import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom";
import NavBar from "./components/NavBar";


function App() {
  return (
      <BrowserRouter>
        <div className="app">
          <NavBar/>

        </div>
      </BrowserRouter>
  );
}

export default App;