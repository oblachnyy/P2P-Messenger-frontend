import "./App.css";
import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import Login from "./pages/auth/Login";
import Home from "./pages/nav/Home";
import Logout from "./pages/auth/Logout";
import Registration from "./pages/auth/Registration";
import Favorites from "./pages/nav/Favorites";
import VideoChatPage from "./pages/chat/VideoChatPage";
import Profile from "./pages/nav/Profile";
import Dashboard from "./pages/chat/Dashboard";


function App() {
  return (
      <BrowserRouter>
        <div className="app">
          <NavBar/>
            <Switch>
                <ProtectedRoute path="/dashboard" page={Dashboard}/>
                <ProtectedRoute path="/favorites" page={Favorites}/>
                <ProtectedRoute path="/video/" page={VideoChatPage}/>
                <ProtectedRoute path="/profile" page={Profile}/>
                <Route path="/registration" component={Registration}/>
                <Route path="/login" component={Login}/>
                <Route path="/logout" component={Logout}/>
                <ProtectedRoute path="/home" page={Home}/>
                <Redirect from="/" to="/login" />

            </Switch>
        </div>
      </BrowserRouter>
  );
}

export default App;