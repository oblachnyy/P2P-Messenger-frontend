import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {configure, mount, shallow} from 'enzyme';
import Dashboard from '../pages/Chat/Dashboard';
import React from "react";
import Adapter from "enzyme-adapter-react-16";
import {get_user_from_token} from "../api/auth";

configure({ adapter: new Adapter() });

describe('Dashboard Component', () => {

    let mock

    beforeEach(() => {
        mock = new MockAdapter(axios);

    });

    afterEach(() => {
        mock.reset();
    });

    it('should fetch user data and set state on successful request', async () => {
        const mockUserData = { username: 'testUser' };
        const token = 'your_token';  // Replace with a valid token
        localStorage.setItem('token', token);

        mock.onGet(get_user_from_token).reply(200, mockUserData);

        const wrapper = mount(<Dashboard />);

        await new Promise((resolve) => setImmediate(resolve));

        expect(wrapper.state().currentUser).toEqual('testUser');
        expect(wrapper.state().isLoaded).toBe(true);
    });

    it('should remove token from local storage on failed request', async () => {
        const token = 'your_token';  // Replace with a valid token
        localStorage.setItem('token', token);

        mock.onGet(get_user_from_token).reply(500);

        const wrapper = mount(<Dashboard />);

        await new Promise((resolve) => setImmediate(resolve));

        expect(localStorage.getItem('token')).toBeNull();
    });

});