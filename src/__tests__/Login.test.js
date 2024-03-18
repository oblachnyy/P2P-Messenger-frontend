import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import Login from '../pages/auth/Login';
import Adapter from 'enzyme-adapter-react-16';
import { mount, configure, shallow  } from 'enzyme';


// Mock axios post function
jest.mock('axios');

configure({ adapter: new Adapter() });

describe('Login component tests', () => {
    it('renders Login component', () => {
        const { getByText,
                getByPlaceholderText } = render(<Login />);
        expect(getByText('PolyTex')).toBeInTheDocument();
        expect(getByPlaceholderText('Введите логин')).toBeInTheDocument();
        expect(getByPlaceholderText('Введите пароль')).toBeInTheDocument();
    });

    it('handles username input change', () => {
        const { getByPlaceholderText } = render(<Login />);
        const usernameInput = getByPlaceholderText('Введите логин');

        fireEvent.change(usernameInput, { target: { value: 'testUser' } });

        expect(usernameInput.value).toBe('testUser');
    });

    it('handles password input change', () => {
        const { getByPlaceholderText } = render(<Login />);
        const passwordInput = getByPlaceholderText('Введите пароль');

        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        expect(passwordInput.value).toBe('testPassword');
    });

    it('disables login button when form is invalid', () => {
        const { getByText } = render(<Login />);
        const loginButton = getByText('Войти');

        expect(loginButton).toBeDisabled();
    });

    it('enables login button when form is valid, FS_LOGIN_3', () => {
        const { getByText, getByPlaceholderText } = render(<Login />);
        const loginButton = getByText('Войти');
        const usernameInput = getByPlaceholderText('Введите логин');
        const passwordInput = getByPlaceholderText('Введите пароль');

        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        expect(loginButton).toBeEnabled();
    });

    it('displays error message for invalid login attempt, FS_LOGIN_2', async () => {
        axios.post.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });

        const { getByText, getByPlaceholderText } = render(<Login />);
        const loginButton = getByText('Войти');
        const usernameInput = getByPlaceholderText('Введите логин');
        const passwordInput = getByPlaceholderText('Введите пароль');

        fireEvent.change(usernameInput, { target: { value: 'invalidUser' } });
        fireEvent.change(passwordInput, { target: { value: 'invalidPassword' } });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(getByText('Такого пользователя не существует.')).toBeInTheDocument();
        });
    });

    it('should set isLoggedIn state and localStorage on successful login', async () => {
        const mockAccessToken = 'fakeAccessToken';
        const mockUsername = 'testUser';

        const axiosPostMock = jest.spyOn(require('axios'), 'post');
        axiosPostMock.mockResolvedValueOnce({ data: { access_token: mockAccessToken } });

        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };

        // Replace the real localStorage with the mock
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        const wrapper = shallow(<Login />);

        wrapper.find('input[name="uname"]').simulate('change', { target: { value: mockUsername } });
        wrapper.find('input[name="psw"]').simulate('change', { target: { value: 'testPassword' } });

        const instance = wrapper.instance();

        await instance.loginHandler(new Event('click'));

        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockAccessToken);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('email', mockUsername);
        expect(wrapper.state('isLoggedIn')).toBe(true);
    });

    it('should set error_message state on unsuccessful login', async () => {
        const axiosPostMock = jest.spyOn(require('axios'), 'post');
        axiosPostMock.mockRejectedValueOnce({
            response: {
                status: 400,
                data: { message: 'Bad Request' }
            }
        });

        const wrapper = shallow(<Login />);

        const instance = wrapper.instance();

        await instance.loginHandler(new Event('click'));

        await Promise.resolve();

        expect(wrapper.state('error_message')).toBe('Такого пользователя не существует.');
    });

    it('should set error_message state on unsuccessful login with undefined token', async () => {
        const axiosPostMock = jest.spyOn(require('axios'), 'post');
        axiosPostMock.mockResolvedValueOnce({ data: { access_token: undefined } });

        const wrapper = shallow(<Login />);

        const instance = wrapper.instance();
        await instance.loginHandler(new Event('click'));

        await Promise.resolve();

        expect(wrapper.state('error_message')).toBe('Please try again.');
    });

});