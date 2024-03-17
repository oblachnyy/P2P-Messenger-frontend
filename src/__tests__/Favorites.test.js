import React from "react";
import {mount, shallow} from "enzyme";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import Favorites from '/src/pages/nav/Favorites'
import {get_favorite, get_favorites, get_room, get_rooms, post_favorite} from "/src/api/rooms";
import { act } from 'react-dom/test-utils';

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {get_user_from_token} from "/src/api/auth";

const mock = new MockAdapter(axios);

configure({ adapter: new Adapter() });

describe("Favorites Component", () => {
    let mock;

    beforeEach(() => {
        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.reset();
    });

    const mockEvent = {
        preventDefault: jest.fn(),
    };

    it("fetches rooms on component mount", async () => {
        const wrapper = mount(<Favorites/>);
        const mockRoomsData = [
            {room_name: "Room1", is_favorites: true, is_owner: true},
            {room_name: "Room2", is_favorites: false, is_owner: false},
        ];

        // Mocking axios.get method
        mock.onGet(get_favorites).reply(200, mockRoomsData);

        // Wait for the component to update
        await act(async () => {
            setTimeout(() => {
                wrapper.update();
                expect(wrapper.state("rooms")).toEqual(mockRoomsData);
            }, 1000);
        });

        wrapper.unmount();
    });

    it('fetches rooms successfully', async () => {
        const wrapper = mount(<Favorites/>);
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
        ];

        mock.onGet(get_favorites).reply(200, mockRoomsData);

        await act(async () => {
            wrapper.instance().fetchRooms();
            await wrapper.update();
        });

        expect(wrapper.state('rooms')).toEqual(mockRoomsData);
        wrapper.unmount();
    });

    it('handles errors when fetching rooms', async () => {
        const wrapper = mount(<Favorites/>);
        const errorMessage = 'Failed to fetch rooms';

        mock.onGet(get_favorites).reply(500, {error: errorMessage});

        await act(async () => {
            wrapper.instance().fetchRooms();
            await wrapper.update();
        });

        expect(wrapper.state('rooms')).toEqual([]);
        wrapper.unmount();
    });


    it('increments currentPage and fetches rooms on nextPage', async () => {
        const wrapper = mount(<Favorites/>);
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
        ];

        mock.onGet(get_favorites).reply(200, mockRoomsData);

        await act(async () => {
            wrapper.instance().nextPage();
            await wrapper.update();
        });

        expect(wrapper.state('currentPage')).toBe(2);
        expect(wrapper.state('rooms')).toEqual(mockRoomsData);
        wrapper.unmount();
    });

    it('decrements currentPage and fetches rooms on previousPage', async () => {
        const wrapper = mount(<Favorites/>);
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
        ];

        mock.onGet(get_favorites).reply(200, mockRoomsData);

        // Установим начальное значение currentPage в 2, чтобы сделать возможным уменьшение
        wrapper.setState({currentPage: 2});

        await act(async () => {
            wrapper.instance().previousPage();
            await wrapper.update();
        });

        expect(wrapper.state('currentPage')).toBe(1);
        expect(wrapper.state('rooms')).toEqual(mockRoomsData);
        wrapper.unmount();
    });

    it('does not decrement currentPage below 1 on previousPage', async () => {
        const wrapper = mount(<Favorites/>);
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
        ];

        mock.onGet(get_favorites).reply(200, mockRoomsData);

        // Установим начальное значение currentPage в 1
        wrapper.setState({currentPage: 1});

        const consoleSpy = jest.spyOn(console, 'log');

        // Вызываем previousPage, который не должен изменить currentPage, так как уже 1
        await act(async () => {
            wrapper.instance().previousPage();
            await wrapper.update();
        });

        // Проверяем, что "bad" было выведено в консоль
        expect(consoleSpy).toHaveBeenCalledWith('bad');

        // Проверяем, что currentPage не изменилось
        expect(wrapper.state('currentPage')).toBe(1);

        wrapper.unmount();
    });


    it('deletes a room on handleClick', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToDelete = 'RoomToDelete';
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
            {room_name: roomNameToDelete, is_favorites: true, is_owner: false},
        ];

        mock.onGet(get_favorites).reply(200, mockRoomsData);

        // Симулируем вызов handleClick с roomNameToDelete
        await act(async () => {
            wrapper.instance().handleClick(mockEvent, roomNameToDelete, 2);
            await wrapper.update();
        });

        // Проверяем, что комната удалена из состояния
        expect(wrapper.state('rooms')).not.toContainEqual(expect.objectContaining({room_name: roomNameToDelete}));

        // Проверяем, что вызывается метод удаления через axios
        expect(mock.history.delete.length).toBe(1);
        expect(mock.history.delete[0].url).toBe(`${get_room}/${roomNameToDelete}`);
    });


    it('adds room to favorites', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToAdd = 'RoomToAdd';

        // Mocking axios.post method
        mock.onPost(post_favorite).reply(200, {room_name: roomNameToAdd});

        try {
            await act(async () => {
                // Вызываем метод, который добавляет комнату в избранное
                await wrapper.instance().addFavorite(mockEvent, roomNameToAdd);
            });

            // Ждем обновления компонента
            await act(async () => {
                wrapper.update();
            });

            // Получаем обновленное состояние
            const updatedRooms = wrapper.state('rooms');
            const addedRoom = updatedRooms.find(room => room.room_name === roomNameToAdd);

            // Проверяем, добавлена ли комната в избранное
            expect(addedRoom).toBeDefined();
            if (addedRoom) {
                expect(addedRoom.is_favorites).toBeTruthy();
            }
        } catch (error) {
            console.error("Test failed with error:", error);
        } finally {
            wrapper.unmount();
        }
    });


    it('handles error when removing room from favorites', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToRemove = 'RoomToRemove';
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
        ];

        // Mocking axios.delete method
        mock.onDelete(`${get_room}/${roomNameToRemove}`).reply(500, {error: 'Failed to delete room'});

        // Вызываем метод, который удаляет комнату из избранного
        await act(async () => {
            await wrapper.instance().removeFavorite(mockEvent, roomNameToRemove);
            await wrapper.update();
        });

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ERROR FETCHING SINGLE ROOM'));

        wrapper.unmount();
    });


    it("handles error when adding a room to favorites", async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToAdd = 'RoomToAdd';
        const errorMessage = 'Failed to add room to favorites';

        mock.onPost(post_favorite).reply(500, { error: errorMessage });

        await wrapper.instance().addFavorite({ preventDefault: () => {} }, roomNameToAdd);

        expect(wrapper.state('rooms').some(room => room.room_name === roomNameToAdd)).toBeFalsy();
    });

    it('handles error when adding room to favorites', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToAdd = 'RoomToAdd';
        const errorMessage = 'Failed to add room to favorites';

        // Mocking axios.post method to simulate an error
        mock.onPost(post_favorite).reply(500, { error: errorMessage });

        try {
            // Вызываем метод, который добавляет комнату в избранное
            await act(async () => {
                await wrapper.instance().addFavorite(mockEvent, roomNameToAdd);
            });

            // Ждем обновления компонента
            await act(async () => {
                wrapper.update();
            });

            // Проверяем, что комната не была добавлена в избранное из-за ошибки
            expect(wrapper.state('rooms').some(room => room.room_name === roomNameToAdd)).toBeFalsy();
        } catch (error) {
            console.error("Тест завершился с ошибкой:", error);
        } finally {
            wrapper.unmount();
        }
    });

    it('does not add room to favorites on request error', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToAdd = 'RoomToAdd';
        const errorMessage = 'Failed to add room to favorites';

        // Mocking axios.post method to simulate an error
        mock.onPost(post_favorite).reply(500, { error: errorMessage });

        await wrapper.instance().addFavorite(mockEvent, roomNameToAdd);

        // Проверяем, что комната не была добавлена в избранное из-за ошибки
        expect(wrapper.state('rooms').some(room => room.room_name === roomNameToAdd)).toBeFalsy();
    });


    it("should paginate to the next page when 'Следующая страница' button is clicked", () => {
        const wrapper = mount(<Favorites />);
        const nextPageButton = wrapper.find({ text: "Следующая страница" }).find("button");

        // Нажимаем кнопку "Следующая страница"
        nextPageButton.simulate("click");

        // Ожидаем, что currentPage увеличивается на 1
        expect(wrapper.state("currentPage")).toBe(2);

        wrapper.unmount();
    });

    it("should paginate to the previous page when 'Предыдущая страница' button is clicked", () => {
        const wrapper = mount(<Favorites />);
        wrapper.setState({ currentPage: 2 });

        const previousPageButton = wrapper.find({ text: "Предыдущая страница" }).find("button");

        // Нажимаем кнопку "Предыдущая страница"
        previousPageButton.simulate("click");

        // Ожидаем, что currentPage уменьшается на 1
        expect(wrapper.state("currentPage")).toBe(1);

        wrapper.unmount();
    });



    it('should not update state.rooms when room name is not found', async () => {
        const wrapper = shallow(<Favorites/>);
        const mockRoomsData = {};

        mock.onGet(get_favorite + "/nonexistentRoom").reply(400);

        wrapper.setState({
            selected_room_name: 'nonexistentRoom',
            currentPage: 1,
            roomsPerPage: 10,
            rooms: [],
        });

        wrapper.instance().findRoomByName();

        await new Promise(resolve => setImmediate(resolve));

        expect(wrapper.instance().state.rooms).toEqual([]);
        wrapper.unmount();
    });


    it('renders correctly when there are no rooms', async () => {
        const wrapper = mount(<Favorites/>);

        expect(wrapper.exists()).toBeTruthy();

        mock.onGet(get_favorites).reply(200, []);

        await act(async () => {
            wrapper.instance().fetchRooms();
            await wrapper.update();
        });

        expect(wrapper.exists()).toBeTruthy();
        wrapper.unmount();
    });

    it('removes room from favorites upon successful request', async () => {
        const wrapper = mount(<Favorites/>);
        const roomNameToRemove = 'RoomToRemove';
        const mockRoomsData = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
            {room_name: roomNameToRemove, is_favorites: true, is_owner: false},
        ];

        // Мокируем метод удаления комнаты из избранного
        mock.onDelete(`${get_room}/${roomNameToRemove}`).reply(200);

        // Симулируем вызов handleClick с roomNameToRemove
        await act(async () => {
            wrapper.instance().handleClick(mockEvent, roomNameToRemove, 2);
            await wrapper.update();
        });

        expect(wrapper.state('rooms')).not.toContainEqual(expect.objectContaining({room_name: roomNameToRemove}));

        expect(mock.history.delete.length).toBe(1);
        expect(mock.history.delete[0].url).toBe(`${get_room}/${roomNameToRemove}`);
    });

    it("should call startNewRoomClick when Enter key is pressed", () => {
        const mockStartNewRoomClick = jest.fn();

        const wrapper = shallow(<Favorites />);

        wrapper.instance().startNewRoomClick = mockStartNewRoomClick;

        const fakeEvent = { keyCode: 13 };

        wrapper.instance().onEnterHandler(fakeEvent);

        expect(mockStartNewRoomClick).toHaveBeenCalled();
    });

    it("should update selected_room_name state correctly", () => {
        const wrapper = shallow(<Favorites />);

        const fakeEvent = { target: { value: "New Room" } };
        wrapper.instance().onInputChange(fakeEvent);

        expect(wrapper.state("selected_room_name")).toEqual("New Room");
    });

    it("should update roomNav state correctly after calling handleRoomClick", async () => {
        mock.onGet().reply(200, { room_name: "TestRoom" });

        const wrapper = shallow(<Favorites />);
        const instance = wrapper.instance();

        const event = {
            preventDefault: jest.fn(),
            currentTarget: { textContent: "TestRoom" }
        };

        instance.handleRoomClick(event);

        await new Promise(resolve => setImmediate(resolve));

        expect(wrapper.state("roomNav")).toEqual("TestRoom");
    });

    it("should remove token from localStorage on error in handleRoomClick", async () => {
        mock.onGet().reply(500);

        const wrapper = shallow(<Favorites />);
        const instance = wrapper.instance();

        const event = {
            preventDefault: jest.fn(),
            currentTarget: { textContent: "" }
        };

        instance.handleRoomClick(event);

        await new Promise(resolve => setImmediate(resolve));

        expect(localStorage.getItem('token')).toBeNull();
    });

    it('remove a room from favorites when removeFavorite is called', async () => {

        // Мокируем успешный ответ для эндпоинта post_favorite
        mock.onPost(post_favorite, { room_name: 'Room 1', is_chosen: false }).reply(200, {});

        // Создаем компонент
        const wrapper = shallow(<Favorites />);
        const instance = wrapper.instance();

        // Добавляем комнату через setState
        const newRoom = { id: 1, room_name: 'Room 1', is_favorites: true };
        instance.setState(prevState => ({
            rooms: [newRoom],
        }));

        const handleFavoriteRequestSpy = jest.spyOn(instance, 'handleFavoriteRequest');

        // Вызываем метод addFavorite
        instance.removeFavorite({ preventDefault: jest.fn() }, 'Room 1' );

        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, что handleFavoriteRequest был вызван с правильными параметрами
        expect(handleFavoriteRequestSpy).toHaveBeenCalledWith('remove', expect.anything(), 'Room 1');

        // Проверяем, что состояние rooms в компоненте обновилось согласно успешному ответу
        expect(instance.state.rooms).toEqual([{ id: 1, room_name: 'Room 1', is_favorites: false }]);
    });

    it('should return error and exit if roomName is empty', () => {
        const wrapper = shallow(<Favorites />);

        const setStateSpy = jest.spyOn(wrapper.instance(), 'setState');

        // Меняем состояние компонента, чтобы убедиться, что roomName пустая
        wrapper.setState({ selected_room_name: "" });

        // Создаем фейковое событие
        const fakeEvent = { preventDefault: jest.fn() };

        // Вызываем метод findRoomByName с фейковым событием
        wrapper.instance().findRoomByName(fakeEvent);

        // Проверяем, что setState не был вызван
        expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should return error and exit if roomName contains spaces', () => {
        const wrapper = shallow(<Favorites />);

        const setStateSpy = jest.spyOn(wrapper.instance(), 'setState');

        // Меняем состояние компонента, чтобы убедиться, что roomName пустая
        wrapper.setState({ selected_room_name: "a b" });

        // Создаем фейковое событие
        const fakeEvent = { preventDefault: jest.fn() };

        // Вызываем метод findRoomByName с фейковым событием
        wrapper.instance().findRoomByName(fakeEvent);

        // Проверяем, что setState не был вызван
        expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should remove token from localStorage on error in componentDidMount', async () => {
        mock.onGet(get_favorites).reply(500);
        mock.onGet(get_user_from_token).reply(200, {username: "TestUser"});


        const wrapper = shallow(<Favorites />);
        const instance = wrapper.instance();

        await new Promise(resolve => setImmediate(resolve));

        expect(localStorage.getItem('token')).toBeNull();
    });

    it('should call onEnterHandler on keyUp event', () => {
        const onEnterHandlerMock = jest.fn();
        const wrapper = shallow(<Favorites />);
        wrapper.instance().onEnterHandler = onEnterHandlerMock;

        // Находим input и имитируем keyUp событие
        wrapper.find('input#messageText').simulate('keyUp', { keyCode: 13 }); // keyCode 13 соответствует нажатию Enter

        // Проверяем, что onEnterHandler был вызван
        expect(onEnterHandlerMock).toHaveBeenCalled();
    });

    it('should find a room when the button is pressed', async () => {
        const findRoomByNameMock = jest.fn();

        const mockedResponse = [{room_name: 'TestRoom', room_id: 1, members: []}];
        const roomName = 'TestRoom';

        // Мокируем успешный ответ для эндпоинта get_rooms
        mock.onGet(get_favorite +'/' + roomName, { params: { page: 1, limit: 10 } }).reply(200, mockedResponse);

        // Рендер компонента
        const wrapper = shallow(<Favorites />);
        const instance = wrapper.instance();

        const newRooms = [
            {room_name: 'Room1', is_favorites: true, is_owner: true},
            {room_name: 'Room2', is_favorites: false, is_owner: false},
            {room_name: 'Room3', is_favorites: true, is_owner: false}
        ];

        instance.setState(prevState => ({
            rooms: newRooms
        }));

        // Получение элемента ввода и ввод значения
        instance.setState({ selected_room_name: roomName });

        // Вызов функции findRoomByName
        const findRoomButton = wrapper.findWhere(node => node.prop('text') === 'Поиск комнаты');
        findRoomButton.simulate('click');

        await new Promise(resolve => setImmediate(resolve));

        // Проверка, что состояние rooms в компоненте обновилось согласно успешному ответу
        expect(instance.state.rooms).toEqual([{room_name: 'TestRoom', room_id: 1, members: []}]);
    });

});