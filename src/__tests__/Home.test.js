import React from 'react';
import {render, fireEvent, screen, waitFor, getByText} from '@testing-library/react';
import { shallow, configure, mount } from 'enzyme';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import Home from '../pages/nav/Home';
import Adapter from 'enzyme-adapter-react-16';
import MockAdapter from 'axios-mock-adapter';
import { act } from 'react-dom/test-utils';
import {get_user_from_token} from "../api/auth";
import {get_room, get_rooms, post_favorite, post_room} from "../api/rooms";

configure({ adapter: new Adapter() });

describe('Home component', () => {

    let mock;

    beforeEach(() => {
        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.reset();
    });

    it("renders without crashing", async () => {
        let wrapper;

        await act(async () => {
            wrapper = mount(<Home />);
            // Дополнительные асинхронные действия могут быть добавлены здесь
        });
        wrapper.unmount();
    });

    it('disables create room button when input is empty, FS_Home_2', async () => {
        const { getByText } = render(<Home />);
        const createRoomButton = getByText('Создать комнату');

        expect(createRoomButton).toBeDisabled();
    });

    test('The "Create room" button becomes active when you enter text', () => {
        const { getByText, getByTestId } = render(<Home />);

        // Получаем элемент input по его атрибуту data-testid
        const inputElement = getByTestId('roomInput');

        // Симулируем ввод текста в input
        fireEvent.change(inputElement, { target: { value: 'Новая комната' } });

        // Проверяем, что кнопка "Создать комнату" стала активной
        const createRoomButton = getByText('Создать комнату');
        expect(createRoomButton).toBeEnabled();
    });


    it('increments currentPage and fetches rooms when nextPage is called', async () => {
        mock.onGet(get_user_from_token).reply(200, []);

        const mockedRooms = [{ id: 1, room_name: 'Room 1' }, { id: 2, room_name: 'Room 2' }];
        mock.onGet(get_rooms, { params: { page: 2, limit: 10 } }).reply(200, mockedRooms);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        const fetchRoomsSpy = jest.spyOn(instance, 'fetchRooms');

        expect(instance.state.currentPage).toBe(1);
        instance.nextPage();
        expect(instance.state.currentPage).toBe(2);

        await new Promise(resolve => setImmediate(resolve));

        expect(fetchRoomsSpy).toHaveBeenCalledWith();

        //состояние rooms в компоненте обновилось согласно мокированному ответу
        expect(instance.state.rooms).toEqual(mockedRooms);
    });

    it('decrements currentPage and fetches rooms when previousPage is called', async () => {
        mock.onGet(get_user_from_token).reply(200, []);

        const mockedRooms = [{ id: 1, room_name: 'Room 1' }, { id: 2, room_name: 'Room 2' }];
        mock.onGet(get_rooms, { params: { page: 1, limit: 10 } }).reply(200, mockedRooms);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        instance.setState({ currentPage: 2 });

        const fetchRoomsSpy = jest.spyOn(instance, 'fetchRooms');

        expect(instance.state.currentPage).toBe(2);
        instance.previousPage();
        expect(instance.state.currentPage).toBe(1);

        await new Promise(resolve => setImmediate(resolve));

        expect(fetchRoomsSpy).toHaveBeenCalledWith();

        expect(instance.state.rooms).toEqual(mockedRooms);
    });

    it('does not decrement currentPage and does not fetch rooms when previousPage is called on page 1', async () => {
        mock.onGet(get_user_from_token).reply(200, []);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        instance.setState({ currentPage: 1 });

        const fetchRoomsSpy = jest.spyOn(instance, 'fetchRooms');

        instance.previousPage();

        expect(instance.state.currentPage).toBe(1);

        expect(fetchRoomsSpy).not.toHaveBeenCalled();
    });

    it('adds or removes a room from favorites when corresponding function is called', async () => {
        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        const newRoom = { id: 1, room_name: 'Room 1', is_favorites: false };
        instance.setState({ rooms: [newRoom] });

        const handleFavoriteRequestSpy = jest.spyOn(instance, 'handleFavoriteRequest');

        // Добавляем комнату в избранное
        mock.onPost(post_favorite, { room_name: 'Room 1', is_chosen: true }).reply(200, {});
        instance.addFavorite({ preventDefault: jest.fn() }, 'Room 1');
        await new Promise(resolve => setImmediate(resolve));
        expect(handleFavoriteRequestSpy).toHaveBeenCalledWith('add', expect.anything(), 'Room 1');
        expect(instance.state.rooms).toEqual([{ id: 1, room_name: 'Room 1', is_favorites: true }]);

        // Удаляем комнату из избранного
        mock.onPost(post_favorite, { room_name: 'Room 1', is_chosen: false }).reply(200, {});
        instance.removeFavorite({ preventDefault: jest.fn() }, 'Room 1');
        await new Promise(resolve => setImmediate(resolve));
        expect(handleFavoriteRequestSpy).toHaveBeenCalledWith('remove', expect.anything(), 'Room 1');
        expect(instance.state.rooms).toEqual([{ id: 1, room_name: 'Room 1', is_favorites: false }]);
    });

    it('updates new_room_name state when input changes', () => {
        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        // Имитируем событие изменения значения ввода
        const event = { target: { value: 'NewRoom' } };
        instance.onNewRoomChange(event);

        // Проверяем, что состояние обновлено с правильным значением
        expect(instance.state.new_room_name).toEqual('NewRoom');
    });

    it('creates a new room and adds it to favorites, FS_CreateRoom_1', async () => {
        const mockedRoomResponse = { room_name: 'NewRoom' };
        mock.onPost(post_room).reply(200, mockedRoomResponse);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        const addFavoriteMock = jest.spyOn(instance, 'addFavorite');

        instance.setState({ new_room_name: 'NewRoom' });

        instance.startNewRoomClick({ preventDefault: jest.fn() });

        await new Promise(resolve => setImmediate(resolve));

        //Проверяем, что axios.post вызывается с правильными параметрами
        expect(mock.history.post.length).toBe(2);
        expect(mock.history.post[0].data).toEqual(JSON.stringify({ room_name: 'NewRoom' }));

        expect(addFavoriteMock).toHaveBeenCalledWith(expect.anything(), 'NewRoom');

        expect(instance.state.roomNav).toEqual('NewRoom');
    });

    it('does not allow creating a room with a duplicate name, FS_CreateRoom_1', async () => {
        const roomName = 'DuplicateRoom';

        mock.onPost(post_room, { room_name: roomName }).reply(400, { detail: 'Room name is already taken. Please choose a different name.' });

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        wrapper.setState({ new_room_name: roomName });

        instance.startNewRoomClick({ preventDefault: jest.fn() });

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.errorMessage).toEqual('Название комнаты не должно дублировать название других комнат');
    });


    it('validates room name restrictions, FS_CreateRoom_1', async () => {
        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        instance.setState({ new_room_name: '' });

        instance.startNewRoomClick({ preventDefault: jest.fn() });

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.errorMessage).toEqual("Название комнаты не может быть пустым");

        expect(wrapper.find('p').text()).toEqual("Название комнаты не может быть пустым");

        // Test for room name consisting only of a space
        instance.setState({ new_room_name: " " });
        instance.startNewRoomClick({ preventDefault: jest.fn() });

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.errorMessage).toEqual("Название комнаты не может быть пустым");

        expect(wrapper.find('p').text()).toEqual("Название комнаты не может быть пустым");

        // Test for room name with more than 20 characters
        instance.setState({ new_room_name: '1234567890qwertyuiopa' });
        instance.startNewRoomClick({ preventDefault: jest.fn() });

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.errorMessage).toEqual("Название комнаты не может иметь более 20 символов");

        expect(wrapper.find('p').text()).toEqual("Название комнаты не может иметь более 20 символов");
    });

    it('should find a room when the button is pressed', async () => {
        const mockedResponse = [{room_name: 'TestRoom', room_id: 1, members: []}];
        const roomName = 'TestRoom';

        mock.onGet(get_rooms +'/' + roomName).reply(200, mockedResponse);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        const newRooms = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
            {room_name: 'Room3', is_favorites: true, is_owner: false}
        ];

        instance.setState(prevState => ({
            rooms: newRooms
        }));

        instance.setState({ selected_room_name: roomName });

        const findRoomButton = wrapper.findWhere(node => node.prop('text') === 'Поиск комнаты');
        findRoomButton.simulate('click');

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.rooms).toEqual([{room_name: 'TestRoom', room_id: 1, members: []}]);
    });

    it('validates roomName in findRoomByName', () => {
        const wrapper = shallow(<Home />);

        const setStateSpy = jest.spyOn(wrapper.instance(), 'setState');

        wrapper.setState({ selected_room_name: "" });

        const fakeEvent = { preventDefault: jest.fn() };

        wrapper.instance().findRoomByName(fakeEvent);

        // Проверяем, что setState не был вызван
        expect(setStateSpy).not.toHaveBeenCalled();

        wrapper.setState({ selected_room_name: "a b" });

        wrapper.instance().findRoomByName(fakeEvent);

        expect(setStateSpy).not.toHaveBeenCalled();
    });


    it('handles room click and sets roomNav state', async () => {
        const mockedResponse = { room_name: 'TestRoom', room_id: 1, members: [] };
        const room = { room_name: 'TestRoom', id: 1, is_favorites: false};

        mock.onGet(get_room + '/' + 'TestRoom').reply(200, mockedResponse);

        const wrapper = shallow(<Home />);
        const instance = wrapper.instance();

        const newRoom = { room };
        instance.setState(prevState => ({
            rooms: [newRoom],
        }));

        // Имитация клика на Chip с передачей значения комнаты
        const chip = wrapper.findWhere(node => node.prop('data-testid') === 'TEST2');
        await chip.simulate('click', {
            preventDefault: jest.fn(),
            currentTarget: { textContent: room.room_name },
        });

        await new Promise(resolve => setImmediate(resolve));

        expect(instance.state.roomNav).toEqual('TestRoom');
    });

    it('should have default value of 10 for roomsPerPage, FS_Pagination_1', () => {
        const wrapper = mount(<Home />);
        const defaultRoomsPerPage = wrapper.state().roomsPerPage;
        expect(defaultRoomsPerPage).toBe(10);
    });
});






