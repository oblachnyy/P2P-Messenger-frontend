import React from "react";
import { Redirect } from "react-router-dom";

class Logout extends React.Component {
    constructor() {
        super();
        this.state = {
            isLogout: false,
        };
        this.deleteHistory = this.deleteHistory.bind(this);
    }

    componentDidMount() {
        this.deleteHistory();
    }

    deleteHistory() {
        localStorage.clear();
        this.setState({ isLogout: true });
    }

    render() {
        const { isLogout } = this.state;

        if (isLogout) {
            return <Redirect push to="/login" />;
        }

        return <div>Logging out...</div>;
    }
}

export default Logout;