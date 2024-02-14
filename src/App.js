import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom";
import NavBar from "./components/NavBar";
import Login from "./pages/auth/Login";


function App() {
  return (
      <BrowserRouter>
        <div className="app">
          <NavBar/>
            <Switch>
                <Route path="/login" component={Login}/>

            </Switch>
        </div>
      </BrowserRouter>
  );
}

export default App;