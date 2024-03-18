import React from 'react';
import {mount, configure} from 'enzyme';
import Registration from '/src/pages/auth/Registration';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Adapter from 'enzyme-adapter-react-16';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import { act } from '@testing-library/react';
import { login, registration } from "/src/api/auth";

configure({ adapter: new Adapter() });

describe('Registration component', () => {

    it('registration upon entering correct data.', async () => {
        const mock = new MockAdapter(axios);
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        mock.onPost(registration).reply(201, {});

        registrationComponent.find('input[name="email"]').simulate('change', { target: { value: 'test@example.com' } });
        registrationComponent.find('input[name="uname"]').simulate('change', { target: { value: 'testUser123' } });
        registrationComponent.find('input[name="psw"]').simulate('change', { target: { value: 'password123' } });

        instance.registerHandler();

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.isRegisteredIn).toBe(true)
    });

    it('handles registration errors correctly', async () => {
        const mock = new MockAdapter(axios);
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        // Test case 1: User with provided email already exists
        mock.onPost(registration).reply(400, { detail: "REGISTER_USER_ALREADY_EXISTS" });
        instance.setState({
            isEmailValid: true,
            isUsernameValid: true,
            isPasswordValid: true,
            email: 'test@example.com',
            username: 'testUser123',
            password: 'password123'
        });
        instance.registerHandler();
        await new Promise(resolve => setImmediate(resolve));
        expect(instance.state.error_message).toEqual("Пользователь с таким email существует.");

        // Test case 2: Registration failure with incorrect server response
        mock.onPost(registration).reply(500, {});
        instance.registerHandler();
        await new Promise(resolve => setImmediate(resolve));
        expect(instance.state.error_message).toEqual("Ошибка во время регистрации.");
    });

    it('should set error message when login after registration fails', async () => {
        // Создаем мок для axios
        const mock = new MockAdapter(axios);

        // Создаем компонент Registration и получаем его инстанс
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        // Мокируем запрос с неправильным статусом
        mock.onPost(login).reply(500);

        // Устанавливаем значения полей формы
        instance.setState({
            username: 'testUser123',
            password: 'password123'
        });

        // Вызываем метод loginHandler
        instance.loginHandler();
        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, что сообщение об ошибке установлено правильно
        expect(instance.state.error_message).toEqual("Error with logging in after registration");
    });

    it('should set isRegisteredIn to true and call loginHandler on successful registration', async () => {
        // Создаем мок для axios
        const mock = new MockAdapter(axios);

        // Создаем компонент Registration и получаем его инстанс
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        // Устанавливаем значения полей формы
        instance.setState({
            isEmailValid: true,
            isUsernameValid: true,
            isPasswordValid: true,
            email: 'test@example.com',
            username: 'testUser123',
            password: 'password123'
        });

        // Мокируем успешный запрос регистрации
        mock.onPost(registration, {
            email: 'test@example.com',
            password: 'password123',
            is_active: true,
            is_superuser: false,
            is_verified: false,
            username: 'testUser123'
        }).reply(201)

        const loginHandlerSpy = jest.spyOn(instance, 'loginHandler');

        // Вызываем метод registerHandler
        instance.registerHandler();

        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, что isRegisteredIn установлен в true
        expect(instance.state.isRegisteredIn).toBe(true);

        // Проверяем, что метод loginHandler был вызван
        expect(loginHandlerSpy).toHaveBeenCalled();
    });


    it('clears form fields upon calling clearFields', () => {
        const registrationComponent = mount(<Registration />);

        // Устанавливаем значения полей формы
        registrationComponent.find('input[name="email"]').simulate('change', { target: { value: 'test@example.com' } });
        registrationComponent.find('input[name="uname"]').simulate('change', { target: { value: 'testUser123' } });
        registrationComponent.find('input[name="psw"]').simulate('change', { target: { value: 'password123' } });

        // Вызываем clearFields
        registrationComponent.instance().clearFields();

        // Проверяем, что все поля формы были очищены
        expect(registrationComponent.state('email')).toBe('');
        expect(registrationComponent.state('username')).toBe('');
        expect(registrationComponent.state('password')).toBe('');
        expect(registrationComponent.state('error_message')).toBe('');
        expect(registrationComponent.state('warning_message')).toBe('');
        expect(registrationComponent.state('isFormValid')).toBe(false);
    });

    it('sets isRegisteredIn to true and calls loginHandler upon successful registration', async () => {
        const mock = new MockAdapter(axios);
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        // Мокаем успешную регистрацию
        mock.onPost('http://localhost:8000/api/register').reply(201, {});

        // Создаем стаб заглуку для loginHandler
        const loginHandlerStub = jest.fn();
        instance.loginHandler = loginHandlerStub;

        registrationComponent.find('input[name="email"]').simulate('change', { target: { value: 'test@example.com' } });
        registrationComponent.find('input[name="uname"]').simulate('change', { target: { value: 'testUser123' } });
        registrationComponent.find('input[name="psw"]').simulate('change', { target: { value: 'password123' } });

        await act(async () => {
            await instance.registerHandler();
        });

        expect(registrationComponent.state('isRegisteredIn')).toBe(true);
        expect(loginHandlerStub).toHaveBeenCalled();
    });

    it('sets error message upon invalid registration data.', async () => {
        const registrationComponent = mount(<Registration />);
        const instance = registrationComponent.instance();

        // Устанавливаем значения полей формы (делаем их невалидными)
        registrationComponent.find('input[name="email"]').simulate('change', { target: { value: 'invalid-email' } });
        registrationComponent.find('input[name="uname"]').simulate('change', { target: { value: '' } });
        registrationComponent.find('input[name="psw"]').simulate('change', { target: { value: '' } });

        await act(async () => {
            await instance.registerHandler();
        });

        expect(registrationComponent.state('error_message')).toBe('Пожалуйста, введите корректные данные во все поля.');
    });

    it('redirect after successful registration and login', async () => {
        const registrationComponent = mount(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );
        const instance = registrationComponent.find('Registration').instance();
        const mock = new MockAdapter(axios);

        // Mock успешной регистрации
        mock.onPost('http://localhost:8000/api/register').reply(201, {});

        // Устанавливаем значения формы
        registrationComponent.find('input[name="email"]').simulate('change', { target: { value: 'test@example.com' } });
        registrationComponent.find('input[name="uname"]').simulate('change', { target: { value: 'testUser123' } });
        registrationComponent.find('input[name="psw"]').simulate('change', { target: { value: 'password123' } });

        // Mock успешного входа
        mock.onPost('http://127.0.0.1:8000/api/auth/jwt/login').reply(200, { access_token: 'mocked-token' });

        await act(async () => {
            await instance.registerHandler();
        });

        // Ожидаем успешной регистрации
        expect(registrationComponent.find('Registration').state('isRegisteredIn')).toBe(true);

        // Ожидаем успешного входа
        expect(registrationComponent.find('Registration').state('isLoggedIn')).toBe(true);
    });

});