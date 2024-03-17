import NavBar from '../components/NavBar';
import {configure, shallow, mount} from "enzyme";
import {BrowserRouter, MemoryRouter, NavLink} from "react-router-dom";
import Adapter from "enzyme-adapter-react-16";
import React from 'react';
import {render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import {act} from "react-dom/test-utils";

configure({ adapter: new Adapter() });



describe('NavBar Component', () => {

    it('renders without errors', () => {
        const { getByText } = render(
            <BrowserRouter>
                <NavBar />
            </BrowserRouter>
        );

        // Проверяем, что определенный текст присутствует на странице
        expect(getByText('Домашняя страница')).toBeInTheDocument();
        expect(getByText('Закладки')).toBeInTheDocument();
        expect(getByText('Профиль')).toBeInTheDocument();
        expect(getByText('Выйти из системы')).toBeInTheDocument();
    });

    it('should render NavLinks with correct styles', () => {
        const wrapper = shallow(<NavBar />);

        const navLinks = wrapper.find(NavLink);

        navLinks.forEach((navLink, index) => {
            const style = navLink.prop('style');
            expect(style).toHaveProperty('textDecoration', 'none');
            expect(style).toHaveProperty('color', '#fcfcfc');
            const expectedTexts = ['Домашняя страница', 'Закладки', 'Профиль', 'Выйти из системы'];
            expect(navLink.text()).toBe(expectedTexts[index]);
        });
    });

});
