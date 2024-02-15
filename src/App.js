import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import Login from "./pages/auth/Login";
import Home from "./pages/nav/Home";
import Logout from "./pages/auth/Logout";
import Registration from "./pages/auth/Registration";


function App() {
  return (
      <BrowserRouter>
        <div className="app">
          <NavBar/>
            <Switch>
                <Route path="/login" component={Login}/>
                <ProtectedRoute path="/home" page={Home}/>
                <Route path="/logout" component={Logout}/>
                <Route path="/registration" component={Registration}/>

            </Switch>
        </div>
      </BrowserRouter>
  );
}

export default App;