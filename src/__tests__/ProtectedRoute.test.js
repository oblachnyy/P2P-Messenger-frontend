import React from 'react';
import {configure, mount} from 'enzyme';
import ProtectedRoute from '../components/ProtectedRoute';
import { MemoryRouter, Route } from 'react-router-dom';
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

describe('ProtectedRoute Component', () => {
    it('should render the specified component when authenticated', () => {
        const MockComponent = () => <div id="mockComponent">Mock Component</div>;
        localStorage.setItem('token', 'valid_token');

        const wrapper = mount(
            <MemoryRouter initialEntries={['/protected']}>
                <ProtectedRoute path="/protected" page={MockComponent} />
            </MemoryRouter>
        );

        expect(wrapper.find('#mockComponent').exists()).toBe(true);
    });

    it('should redirect to login page when not authenticated', () => {
        const MockComponent = () => <div id="mockComponent">Mock Component</div>;
        localStorage.removeItem('token');

        const wrapper = mount(
            <MemoryRouter initialEntries={['/protected']}>
                <ProtectedRoute path="/protected" page={MockComponent} />
            </MemoryRouter>
        );

        expect(wrapper.find('Redirect').prop('to')).toBe('/login');
    });

});