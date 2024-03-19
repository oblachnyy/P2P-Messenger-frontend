import React from "react";
import {mount, shallow} from "enzyme";
import Profile from "../pages/nav/Profile";
import { act } from 'react-dom/test-utils';
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {get_user_from_token} from "../api/auth";
import {MemoryRouter, Redirect} from "react-router-dom";
import 'jest-localstorage-mock';
import {render} from "@testing-library/react";

configure({ adapter: new Adapter() });
const mock = new MockAdapter(axios);
// jest.mock('axios');

describe("Profile", () => {

    afterEach(() => {
        mock.reset();
    });


    it("renders without crashing", () => {
        const wrapper = mount(<Profile />);
        wrapper.unmount();
    });

    it("handles last name change", () => {
        const wrapper = mount(<Profile />);
        wrapper.find('input[placeholder="Фамилия"]').simulate('change', { target: { value: 'NewLastName' } });
        expect(wrapper.state('last_name')).toEqual('NewLastName');
        wrapper.unmount();
    });

    it("handles first name change", () => {
        const wrapper = mount(<Profile />);
        wrapper.find('input[placeholder="Имя"]').simulate('change', { target: { value: 'NewFirstName' } });
        expect(wrapper.state('first_name')).toEqual('NewFirstName');
        wrapper.unmount();
    });

    it("handles surname change", () => {
        const wrapper = mount(<Profile />);
        wrapper.find('input[placeholder="Отчество"]').simulate('change', { target: { value: 'NewSurname' } });
        expect(wrapper.state('surname')).toEqual('NewSurname');
        wrapper.unmount();
    });

    it("toggles avatar edit mode", () => {
        const wrapper = mount(<Profile />);
        const avatarButton = wrapper.find('Button[text="Изменить аватарку"]');

        act(() => {
            setTimeout(() => {
                avatarButton.simulate('click');
                wrapper.update(); // Update the component state
                expect(wrapper.state('isAvatarEditMode')).toEqual(true);
                wrapper.unmount();
            }, 0);
        });
    });

    it("handles new username change", () => {
        const wrapper = mount(<Profile />);
        const newUsernameInput = wrapper.find('input[placeholder="Новый логин"]');
        newUsernameInput.simulate('change', { target: { value: 'NewUsername' } });
        expect(wrapper.state('new_username')).toEqual('NewUsername');
    });

    it("handles password change", () => {
        const wrapper = mount(<Profile />);
        const passwordInput = wrapper.find('input[placeholder="Новый пароль"]');
        passwordInput.simulate('change', { target: { value: 'NewPassword' } });
        expect(wrapper.state('new_password')).toEqual('NewPassword');
    });

    it("prevents default action for Enter key", () => {
        const wrapper = mount(<Profile />);
        const eventMock = { preventDefault: jest.fn(), key: "Enter" };
        wrapper.instance().onEnterHandler(eventMock);
        expect(eventMock.preventDefault).toHaveBeenCalledTimes(1);
    });


    it('initializes with the correct state', () => {
        const wrapper = mount(<Profile />);
        const initialState = {
            user: {
                profile_pic_img_src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png",
            },
            new_email: "",
            new_username: "",
            new_password: "",
            last_name: "",
            first_name: "",
            surname: "",
            isLoaded: true,
            isEditMode: false,
            shouldRedirect: false,
            errorMessage: "",
            isAvatarEditMode: false,
        };
        expect(wrapper.state()).toEqual(initialState);
        wrapper.unmount();
    });

    it("updates state on user data load error", async () => {
        const wrapper = mount(<Profile />);
        mock.onGet("http://localhost:8000/api/user/me").reply(500);
        await wrapper.instance().componentDidMount();
        expect(wrapper.state("user")).toEqual({
            profile_pic_img_src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png"
        });
        expect(wrapper.state("isLoaded")).toEqual(true);
        expect(localStorage.getItem("profilePicURL")).toEqual("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png");
    });

    it("prevents default action for Enter key", () => {
        const wrapper = mount(<Profile />);
        const eventMock = { preventDefault: jest.fn(), key: "Enter" };

        wrapper.instance().onEnterHandler(eventMock);

        expect(eventMock.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("handles error during user data load", async () => {
        mock.onGet("http://localhost:8000/api/user/me").reply(500);

        const wrapper = mount(<Profile />);

        await new Promise(setImmediate);

        // Проверка правильно ли обновилось состояние
        expect(wrapper.state("user")).toEqual({
            profile_pic_img_src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png"
        });
        expect(wrapper.state("isLoaded")).toEqual(true);

        // Проверка обноровление localStorage
        expect(localStorage.getItem("profilePicURL")).toEqual("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png");

        wrapper.unmount();
    });


    it('updates state on email change', () => {
        const wrapper = mount(<Profile />);
        const emailInput = wrapper.find('input[placeholder="Новый e-mail"]');

        // Симуляция изменения почты
        emailInput.simulate('change', { target: { value: 'new.email@example.com' } });

        expect(wrapper.state('new_email')).toEqual('new.email@example.com');

        wrapper.unmount();
    });

    it('does not update state on invalid email input', () => {
        const wrapper = mount(<Profile />);
        const emailInput = wrapper.find('input[placeholder="Новый e-mail"]');

        emailInput.simulate('change', { target: { value: 'invalid_email' } });

        expect(wrapper.state('new_email')).toEqual('invalid_email');

        wrapper.unmount();
    });

    it('updates state on valid username input', () => {
        const wrapper = mount(<Profile />);
        const usernameInput = wrapper.find('input[placeholder="Новый логин"]');

        usernameInput.simulate('change', { target: { value: 'ValidUsername123' } });

        expect(wrapper.state('new_username')).toEqual('ValidUsername123');

        wrapper.unmount();
    });

    it('does not update state on invalid username input', () => {
        const wrapper = mount(<Profile />);
        const usernameInput = wrapper.find('input[placeholder="Новый логин"]');

        usernameInput.simulate('change', { target: { value: 'invalid_username@' } });

        expect(wrapper.state('new_username')).toEqual('invalid_username@');

        wrapper.unmount();
    });

    it('updates state on valid password input', () => {
        const wrapper = mount(<Profile />);
        const passwordInput = wrapper.find('input[placeholder="Новый пароль"]');

        passwordInput.simulate('change', { target: { value: 'ValidPassword123' } });

        expect(wrapper.state('new_password')).toEqual('ValidPassword123');

        wrapper.unmount();
    });

    it('does not update state on invalid password input', () => {
        const wrapper = mount(<Profile />);
        const passwordInput = wrapper.find('input[placeholder="Новый пароль"]');

        passwordInput.simulate('change', { target: { value: 'invalid@password' } });

        expect(wrapper.state('new_password')).toEqual('invalid@password');

        wrapper.unmount();
    });

    it('updates state on valid last_name input', () => {
        const wrapper = mount(<Profile />);
        const lastNameInput = wrapper.find('input[placeholder="Фамилия"]');

        lastNameInput.simulate('change', { target: { value: 'ValidLastName' } });

        expect(wrapper.state('last_name')).toEqual('ValidLastName');

        wrapper.unmount();
    });

    it('updates state on valid first_name input', () => {
        const wrapper = mount(<Profile />);
        const firstNameInput = wrapper.find('input[placeholder="Имя"]');

        firstNameInput.simulate('change', { target: { value: 'ValidFirstName' } });

        expect(wrapper.state('first_name')).toEqual('ValidFirstName');

        wrapper.unmount();
    });

    it('updates state on valid surname input', () => {
        const wrapper = mount(<Profile />);
        const surnameInput = wrapper.find('input[placeholder="Отчество"]');

        surnameInput.simulate('change', { target: { value: 'ValidSurname' } });

        expect(wrapper.state('surname')).toEqual('ValidSurname');

        wrapper.unmount();
    });


    it('toggles edit mode', () => {
        const wrapper = mount(<Profile />);

        // Поиск кнопки "Изменить данные"
        const editButton = wrapper.find('button').filterWhere(button => button.text() === 'Изменить данные');

        // Проверка, найдена ли кнопка перед симуляцией клика
        expect(editButton.exists()).toBe(true);

        // использование act для симуляции клика по кнопке edit
        act(() => {
            editButton.simulate('click');
        });

        wrapper.update();
        expect(wrapper.state('isEditMode')).toEqual(true);

        act(() => {
            editButton.simulate('click');
        });

        wrapper.update();

        expect(wrapper.state('isEditMode')).toEqual(false);

        wrapper.unmount();
    });

    it("fetches user data on component mount", async () => {
        const wrapper = mount(<Profile />);
        const mockUserData = { profile_pic_img_src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png" };

        mock.onGet(get_user_from_token).reply(200, mockUserData);

        await wrapper.instance().componentDidMount();

        expect(wrapper.state("user")).toEqual(mockUserData);
        expect(wrapper.state("isLoaded")).toEqual(true);

        wrapper.unmount();
    });

    it('should toggle isAvatarEditMode when toggleAvatarEditMode is called', () => {
        const wrapper = mount(<Profile />);

        // Проверяем, что изначально isAvatarEditMode равен false
        expect(wrapper.state('isAvatarEditMode')).toBe(false);

        // Вызываем toggleAvatarEditMode
        wrapper.instance().toggleAvatarEditMode();

        // Проверяем, что isAvatarEditMode теперь равен true
        expect(wrapper.state('isAvatarEditMode')).toBe(true);

        // Вызываем toggleAvatarEditMode еще раз
        wrapper.instance().toggleAvatarEditMode();

        // Проверяем, что isAvatarEditMode снова равен false
        expect(wrapper.state('isAvatarEditMode')).toBe(false);
    });

    it('should redirect to /home when shouldRedirect is true', () => {
        const wrapper = mount(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        // Устанавливаем shouldRedirect в true
        wrapper.find(Profile).setState({ shouldRedirect: true });

        // Проверяем, что компонент отрендерил Redirect
        expect(wrapper.find(Redirect).props().to).toBe('/home');
    });


    it('should call onEnterHandler on key up', () => {
        const wrapper = mount(<Profile />);
        const onEnterHandlerSpy = jest.spyOn(wrapper.instance(), 'onEnterHandler');

        // Устанавливаем isEditMode в true
        wrapper.setState({ isEditMode: true });

        // Имитируем нажатие клавиши Enter
        const input = wrapper.find('input[type="password"]');
        input.simulate('keyUp', { key: 'Enter' });

        // Проверяем, что onEnterHandler был вызван
        expect(onEnterHandlerSpy).toHaveBeenCalled();
    });

    it('should set error message if not all fields are filled in, FS_Profile_2', async () => {

        const wrapper = shallow(<Profile />);

        // Установка состояния с невалидными ФИО
        wrapper.setState({
            last_name: 'Иванов',
            first_name: 'Иван',
        });

        // Вызов метода userDateUpload
        await wrapper.instance().userDateUpload({
            preventDefault: jest.fn(),
        });

        // Проверка, что errorMessage устанавливается корректно
        expect(wrapper.state().errorMessage).toEqual('Все поля должны быть заполнены');
    });

    it('should set error message if name or surname filed contain numbers, FS_Profile_2', async () => {

        const wrapper = shallow(<Profile />);

        // Установка начального состояния в компоненте
        wrapper.setState({
            new_email: 'test@mail.ru',
            new_username: 'Test123',
            new_password: '123Test123',
            last_name: 'Test',
            first_name: 'Test11',
            surname: 'Test',
        });

        // Вызов метода userDateUpload
        await wrapper.instance().userDateUpload({
            preventDefault: jest.fn(),
        });

        // Проверка, что errorMessage устанавливается корректно
        expect(wrapper.state().errorMessage).toEqual('Фамилия, имя и отчество могут содержать только буквы');
    });

    it('should set error message if surname filed contain numbers, FS_Profile_2', async () => {

        const wrapper = shallow(<Profile />);

        // Установка начального состояния в компоненте
        wrapper.setState({
            new_email: 'test@mail.ru',
            new_username: 'Test123',
            new_password: '123Test123',
            last_name: 'Test',
            first_name: 'Test',
            surname: 'Test11',
        });

        // Вызов метода userDateUpload
        await wrapper.instance().userDateUpload({
            preventDefault: jest.fn(),
        });

        // Проверка, что errorMessage устанавливается корректно
        expect(wrapper.state().errorMessage).toEqual('Фамилия, имя и отчество могут содержать только буквы');
    });

    it('should not set error message if all fields are valid and set correct state after successful user data update', async () => {

        const wrapper = shallow(<Profile />);
        // Установка состояния с заполненными и валидными данными
        wrapper.setState({
            new_email: 'test@example.com',
            new_username: 'testuser',
            new_password: 'password123',
            last_name: 'Иванов',
            first_name: 'Иван',
        });

        // Настройка ответа на запрос axios
        mock.onPatch('http://localhost:8000/api/user/me').reply(200);

        // Вызов метода userDateUpload
        await wrapper.instance().userDateUpload({
            preventDefault: jest.fn(),
        });

        expect(wrapper.state().errorMessage).toEqual('');

    });

});