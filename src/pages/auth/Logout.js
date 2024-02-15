import React from "react";

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
        return <div>Logging out...</div>;
    }
}

export default Logout;