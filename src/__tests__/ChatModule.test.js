import MockAdapter from "axios-mock-adapter";
import 'jest-environment-jsdom-global';
import axios from "axios";
import React from 'react';
import {configure, shallow, mount} from "enzyme";
import ChatModule from '../components/ChatModule';
import Adapter from "enzyme-adapter-react-16";
import animateScroll from 'react-scroll/modules/mixins/animate-scroll';
import {get_user_from_token} from "../api/auth";
import {get_room, put_user_into_room} from "../api/rooms";
import WebSocket from 'jest-websocket-mock';

configure({ adapter: new Adapter() });

describe('ChatModule component', () => {

    let mock;
    let server;

    beforeEach(() => {
        mock = new MockAdapter(axios);
        // Настроим WebSocket mock
        server = new WebSocket('ws://localhost');
    });

    afterEach(() => {
        mock.reset();
        server.close();
    });

    it('should handle onClickHandler correctly', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const mockWebSocket = { readyState: WebSocket.OPEN, send: jest.fn() };
        global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

        jest.spyOn(instance, 'setState');

        wrapper.setState({
            message_draft: 'Test message',
            currentUser: 'TestUser',
            room_name: 'TestRoom',
            isButtonDisabled: false
        });

        const fakeEvent = { preventDefault: jest.fn() };

        instance.onClickHandler(fakeEvent);

        // Ждем завершения асинхронных операций
        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, вызывался ли preventDefault
        expect(fakeEvent.preventDefault).toHaveBeenCalled();

        // Проверяем, была ли вызвана функция setState с ожидаемыми параметрами
        expect(instance.setState).toHaveBeenCalledWith(
            {
                message_draft: '',
                isButtonDisabled: true,
                selectedMediaFile: null,
            },
            expect.any(Function)
        );
    });

    it('should call handleMediaFile when media file is selected', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        wrapper.setState({
            message_draft: 'Test message',
            currentUser: 'TestUser',
            room_name: 'TestRoom',
            isButtonDisabled: false,
            selectedMediaFile: "testFile"
        });

        const fakeEvent = { preventDefault: jest.fn() };

        // Создаем заглушку для функции handleMediaFile
        const handleMediaFileStub = jest.fn();
        instance.handleMediaFile = handleMediaFileStub;

        instance.onClickHandler(fakeEvent);

        // Ждем завершения асинхронных операций
        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, была ли вызвана функция handleMediaFile
        expect(handleMediaFileStub).toHaveBeenCalled();
    });

    it('should send message via WebSocket when client is not null and readyState is OPEN', () => {
        const mockSend = jest.fn();
        const mockWebSocket = {
            send: mockSend,
            readyState: 1
        };

        const wrapper = shallow(<ChatModule />);
        wrapper.setState({
            currentUser: 'testUser',
            room_name: 'testRoom',
            client: mockWebSocket
        });

        wrapper.instance().sendMessageToChat('test message');

        expect(mockSend).toHaveBeenCalled();
    });

    it('should create a new WebSocket connection if client.readyState is WebSocket.CLOSED', async () => {
        const mockWebSocket = {
            readyState: 2
        };

        // Создаем mock для конструктора WebSocket
        const WebSocketMock = jest.fn(() => mockWebSocket);

        // Создаем mock для компонента
        const wrapper = shallow(<ChatModule />);
        // Устанавливаем состояние компонента
        wrapper.setState({
            room_name: 'testRoom',
            currentUser: 'testUser',
            client: mockWebSocket // Устанавливаем client в WebSocket с состоянием CLOSED
        });

        // Заменяем реальный конструктор WebSocket на мок
        global.WebSocket = WebSocketMock;

        // Вызываем функцию checkWebSocketConnection
        wrapper.instance().checkWebSocketConnection();

        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, что создан новый WebSocket с ожидаемым URL
        expect(WebSocketMock).toHaveBeenCalledWith(
            'ws://localhost:8000/ws/testRoom/testUser'
        );

        // Восстанавливаем оригинальный WebSocket после теста
        global.WebSocket.mockRestore();
    });

    it('renders without crashing', () => {
        const wrapper = shallow(<ChatModule />);
        expect(wrapper.exists()).toBe(true);
    });


    it('renders loading message when data is not loaded', () => {
        const wrapper = shallow(<ChatModule />);
        expect(wrapper.text()).toContain('Loading...');
    });

    it('renders chat after successful data loading', async () => {
        const wrapper = shallow(<ChatModule />);


        await wrapper.setState({ isLoaded: true });
        expect(wrapper.text()).not.toContain('Loading...');
    });

    it('updates state correctly', () => {
        const wrapper = shallow(<ChatModule />);

        const mockEvent = {
            target: { value: 'Test message' },
        };

        wrapper.instance().onInputChange(mockEvent);

        expect(wrapper.state().message_draft).toEqual('Test message');
        expect(wrapper.state().isButtonDisabled).toBe(false); // Предполагая, что Test message не пуст
    });

    it('disables button when message is empty', () => {
        const wrapper = shallow(<ChatModule />);

        const mockEvent = {
            target: { value: '' },
        };

        wrapper.instance().onInputChange(mockEvent);

        expect(wrapper.state().message_draft).toEqual('');
        expect(wrapper.state().isButtonDisabled).toBe(true);
    });

    it('limits message length to 4096 characters', () => {
        const wrapper = shallow(<ChatModule />);

        const longMessageEvent = {
            target: { value: 'A'.repeat(5000) },
        };

        wrapper.instance().onInputChange(longMessageEvent);

        expect(wrapper.state().isButtonDisabled).toBe(true);
    });

    it('should open video chat and sends waiting message', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const mockSendMessageToChat = jest.fn();
        instance.sendMessageToChat = mockSendMessageToChat;

        instance.onOpenVideoChat();

        expect(mockSendMessageToChat).toHaveBeenCalledWith("Пользователь ожидает в видеочате. Пожалуйста, подключитесь!");

        expect(instance.state.openVideoChat).toBe(true);
    });

    it('mocks animateScroll.scrollToBottom', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const mockScrollToBottom = jest.spyOn(animateScroll, 'scrollToBottom');

        instance.scrollToBottom();

        expect(mockScrollToBottom).toHaveBeenCalledWith({
            containerId: 'message-list',
            duration: '1ms',
        });
    });

    it('toggles openEmoji state', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Начальное состояние
        expect(instance.state.openEmoji).toBe(false);

        // Вызываем onOpenEmoji
        instance.onOpenEmoji();

        // Проверяем, было ли изменено состояние openEmoji
        expect(instance.state.openEmoji).toBe(true);

        // Вызываем onOpenEmoji снова
        instance.onOpenEmoji();

        // Проверяем, было ли состояние openEmoji изменено обратно
        expect(instance.state.openEmoji).toBe(false);
    });

    it('adds selected emoji to message_draft and updates state', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Начальное состояние
        expect(instance.state.message_draft).toBe('');
        expect(instance.state.isButtonDisabled).toBe(true);

        const mockEmojiData = { emoji: '😊' };
        instance.onEmojiSelection('mockCode', mockEmojiData);

        // Проверяем, был ли выбранный смайлик добавлен в message_draft
        expect(instance.state.message_draft).toBe('😊');

        // Проверяем, было ли обновлено значение isButtonDisabled
        expect(instance.state.isButtonDisabled).toBe(false);
    });

    it('should disable button when emoji with long message is selected', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        expect(instance.state.message_draft).toBe('');
        expect(instance.state.isButtonDisabled).toBe(true);

        const mockEmojiData = { emoji: '😊'.repeat(5000) };
        instance.onEmojiSelection('mockCode', mockEmojiData);

        expect(instance.state.isButtonDisabled).toBe(true);
    });

    it('calls onAttachFile correctly', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        jest.spyOn(instance, 'checkImageSize').mockImplementation(() => Promise.resolve());
        jest.spyOn(instance, 'isVideoFormatAllowed').mockImplementation(() => Promise.resolve(true));

        const mockFile = new File([''], 'mockFile.jpg', { type: 'image/jpeg' });

        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn(),
        });

        // Вызываем onAttachFile
        instance.onAttachFile();

        // Проверяем, был ли создан элемент input с правильными атрибутами
        expect(createElementSpy).toHaveBeenCalledWith('input');

        jest.restoreAllMocks();
    });

    it('calls showError for invalid file type', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Создаем моковый файл с недопустимым типом
        const mockFile = new File([''], 'mockFile.txt', { type: 'text/plain' });

        // Мокируем метод showError
        jest.spyOn(instance, 'showError').mockImplementation();

        // Создаем моковый элемент input
        const fileInput = {
            type: 'file',
            accept: '.jpg,.png,.jpeg,.webp,.gif,.mp4,.avi,.webm,.mp3,.wav',
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым файлом
                    callback({ target: { files: [mockFile] } });
                }
            }),
            click: jest.fn(),
        };

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        jest.spyOn(document, 'createElement').mockReturnValue(fileInput);

        // Вызываем onAttachFile
        instance.onAttachFile();

        // Проверяем, был ли вызван метод showError с правильным сообщением
        expect(instance.showError).toHaveBeenCalledWith('Неразрешенный тип файла.');

        // Восстанавливаем оригинальные методы
        jest.restoreAllMocks();
    });

    it('calls showError for oversized audio file', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Мокируем метод showError
        jest.spyOn(instance, 'showError').mockImplementation();

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым аудиофайлом
                    const mockAudioFile = new File([''], 'mockAudioFile.mp3', { type: 'audio/mp3' });
                    Object.defineProperty(mockAudioFile, 'size', { value: 10 * 1024 * 1024 });
                    callback({ target: { files: [mockAudioFile] } });
                }
            }),
        });

        // Вызываем onAttachFile
        instance.onAttachFile();

        // Проверяем, был ли вызван метод showError с правильным сообщением
        expect(instance.showError).toHaveBeenCalledWith('Размер аудиофайла превышает максимально допустимый размер (8 MB).');

        // Восстанавливаем оригинальные методы
        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('calls showError for oversized video file', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Используем функцию-шпион для метода showError
        jest.spyOn(instance, 'showError').mockImplementation();

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым видеофайлом
                    const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });
                    Object.defineProperty(mockVideoFile, 'size', { value: 51 * 1024 * 1024 });
                    callback({ target: { files: [mockVideoFile] } });
                }
            }),
        });

        // Вызываем onAttachFile
        instance.onAttachFile();

        // Проверяем, был ли вызван метод showError с правильным сообщением
        expect(instance.showError).toHaveBeenCalledWith('Размер видео превышает максимально допустимый размер (50 MB).');

        // Восстанавливаем оригинальные методы
        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('calls showError for oversized image file', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Используем функцию-шпион для метода showError
        jest.spyOn(instance, 'showError').mockImplementation();

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым изображением
                    const mockImageFile = new File([''], 'mockImageFile.jpeg', { type: 'image/jpeg' });
                    Object.defineProperty(mockImageFile, 'size', { value: 11 * 1024 * 1024 });
                    callback({ target: { files: [mockImageFile] } });
                }
            }),
        });

        // Вызываем onAttachFile
        instance.onAttachFile();

        // Проверяем, был ли вызван метод showError с правильным сообщением
        expect(instance.showError).toHaveBeenCalledWith('Размер изображения превышает максимально допустимый размер (10 MB).');

        // Восстанавливаем оригинальные методы
        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('calls checkImageSize for image file within limits', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Мокируем метод checkImageSize
        jest.spyOn(instance, 'checkImageSize').mockImplementation(() => Promise.resolve());

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым изображением
                    const mockImageFile = new File([''], 'mockImageFile.jpeg', { type: 'image/jpeg' });
                    Object.defineProperty(mockImageFile, 'size', { value: 5 * 1024 * 1024 }); // В пределах лимитов
                    callback({ target: { files: [mockImageFile] } });
                }
            }),
        });

        // Вызываем onAttachFile
        await instance.onAttachFile();

        // Проверяем, был ли вызван метод checkImageSize с правильными аргументами
        expect(instance.checkImageSize).toHaveBeenCalledWith(expect.any(File));

        // Восстанавливаем оригинальные методы
        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('calls isVideoFormatAllowed for video file', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        jest.spyOn(instance, 'isVideoFormatAllowed').mockImplementation(() => Promise.resolve(true));

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Simulate change event with the mock video file
                    const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });
                    Object.defineProperty(mockVideoFile, 'size', { value: 20 * 1024 * 1024 }); // Within limits
                    callback({ target: { files: [mockVideoFile] } });
                }
            }),
        });

        await instance.onAttachFile();

        // Проверяем, был ли вызван метод checkImageSize с правильными аргументами
        expect(instance.isVideoFormatAllowed).toHaveBeenCalledWith(expect.any(File));

        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('shows error for disallowed video format', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Мокируем метод isVideoFormatAllowed для возврата значения false
        jest.spyOn(instance, 'isVideoFormatAllowed').mockImplementation(() => Promise.resolve(false));

        jest.spyOn(instance, 'showError').mockImplementation();

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым видеофайлом
                    const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });
                    Object.defineProperty(mockVideoFile, 'size', { value: 20 * 1024 * 1024 }); // В пределах лимитов
                    callback({ target: { files: [mockVideoFile] } });
                }
            }),
        });

        await instance.onAttachFile();

        // Проверяем, был ли вызван метод showError с правильным сообщением
        expect(instance.showError).toHaveBeenCalledWith('Данный формат видео не поддерживается');

        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('sets state for allowed video format', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Мокируем метод isVideoFormatAllowed для возврата значения true
        jest.spyOn(instance, 'isVideoFormatAllowed').mockImplementation(() => Promise.resolve(true));

        jest.spyOn(instance, 'setState').mockImplementation();

        // Используем функцию-шпион для метода document.createElement, чтобы он возвращал моковый элемент input
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
            click: jest.fn(),
            addEventListener: jest.fn((eventName, callback) => {
                if (eventName === 'change') {
                    // Симулируем событие change с моковым видеофайлом
                    const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });
                    Object.defineProperty(mockVideoFile, 'size', { value: 20 * 1024 * 1024 }); // В пределах лимитов
                    callback({ target: { files: [mockVideoFile] } });
                }
            }),
        });

        await instance.onAttachFile();

        // Проверяем, был ли вызван метод setState с правильными аргументами
        expect(instance.setState).toHaveBeenCalledWith({ selectedMediaFile: expect.any(File), isButtonDisabled: false });

        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('checks if video format is allowed', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Создаем мок для элемента video
        const videoMock = {
            src: '',
            videoWidth: 1920,
            videoHeight: 1080,
            onloadedmetadata: null,
        };

        // Создаем мок для метода document.createElement
        global.document.createElement = jest.fn().mockReturnValue(videoMock);

        // Создаем мок для метода URL.createObjectURL
        global.URL.createObjectURL = jest.fn().mockReturnValue('mockBlobURL');

        // Создаем моковый видеофайл
        const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });

        // Вызываем isVideoFormatAllowed
        const isAllowedPromise = instance.isVideoFormatAllowed(mockVideoFile);

        // Симулируем событие loadedmetadata
        videoMock.onloadedmetadata();

        // Ждем разрешения isAllowedPromise
        const isAllowed = await isAllowedPromise;

        // Проверяем, установлены ли свойства элемента video правильно
        expect(videoMock.src).toBe('mockBlobURL');
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockVideoFile);

        // Проверяем, разрешен ли формат
        expect(isAllowed).toBe(true);
    });

    it('returns false for disallowed video format', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        // Создаем мок для элемента video
        const videoMock = {
            src: '',
            videoWidth: 500,
            videoHeight: 300,
            onloadedmetadata: null,
        };

        // Создаем мок для метода document.createElement
        global.document.createElement = jest.fn().mockReturnValue(videoMock);

        // Создаем мок для метода URL.createObjectURL
        global.URL.createObjectURL = jest.fn().mockReturnValue('mockBlobURL');

        // Создаем моковый видеофайл
        const mockVideoFile = new File([''], 'mockVideoFile.mp4', { type: 'video/mp4' });

        // Вызываем isVideoFormatAllowed
        const isAllowedPromise = instance.isVideoFormatAllowed(mockVideoFile);

        // Симулируем событие loadedmetadata
        videoMock.onloadedmetadata();

        // Ждем разрешения isAllowedPromise
        const isAllowed = await isAllowedPromise;

        // Проверяем, установлены ли свойства элемента video правильно
        expect(videoMock.src).toBe('mockBlobURL');
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockVideoFile);

        // Проверяем, разрешен ли формат
        expect(isAllowed).toBe(false);
    });

    it('handles state changes correctly', () => {
        const wrapper = shallow(<ChatModule />);

        wrapper.setState({ isLoaded: true });

        expect(wrapper.find('#message-list')).toHaveLength(1);
    });

    it('renders loading state', () => {
        const wrapper = shallow(<ChatModule />);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('h1').text()).toBe('Loading...');
    });

    it('renders messages with media files correctly', () => {
        const messages = [
            { user: { username: 'User1' }, message: 'Hello!', media_file_url: 'mockImageFile.jpeg' },
            { user: { username: 'User2' }, message: 'Hi!', media_file_url: 'mockVideoFile.mp4' },
            { user: { username: 'User1' }, message: 'How are you?', media_file_url: 'mockAudioFile.mp3' },
        ];

        const wrapper = shallow(<ChatModule />);
        wrapper.setState({ isLoaded: true, openVideoChat: false, messages });


        expect(wrapper.find('div').at(0).prop('style')).toHaveProperty('flexDirection', 'row-reverse');
        expect(wrapper.find('video')).toHaveLength(1);
        expect(wrapper.find('audio')).toHaveLength(1);
        expect(wrapper.find('img')).toHaveLength(1);

        expect(wrapper.findWhere(node => node.text().includes('Hello!')).exists()).toBe(true);
        expect(wrapper.findWhere(node => node.text().includes('Hi!')).exists()).toBe(true);
        expect(wrapper.findWhere(node => node.text().includes('How are you?')).exists()).toBe(true);
    });

    it('checks image size and resolves if within limits', async () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const imgMock = {
            width: 150,
            height: 120,
            onload: null,
            onerror: null,
        };

        const createObjectURLMock = jest.fn().mockReturnValue('mockBlobURL');

        global.URL.createObjectURL = createObjectURLMock;
        global.document.createElement = jest.fn().mockReturnValue(imgMock);

        const mockImageFile = new File([''], 'mockImageFile.jpg', { type: 'image/jpeg' });

        const promise = instance.checkImageSize(mockImageFile);

        imgMock.onload();

        await expect(promise).resolves.toBeUndefined();

        expect(createObjectURLMock).toHaveBeenCalledWith(mockImageFile);
        expect(document.createElement).toHaveBeenCalledWith('img');
    });

    it('should reject with the correct error message if height or weight < 100',  () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const imgMock = {
            width: 90,
            height: 120,
            onload: null,
            onerror: null,
        };

        const createObjectURLMock = jest.fn().mockReturnValue('mockBlobURL');

        global.URL.createObjectURL = createObjectURLMock;
        global.document.createElement = jest.fn().mockReturnValue(imgMock);

        const mockImageFile = new File([''], 'mockImageFile.jpg', { type: 'image/jpeg' });

        const promise = instance.checkImageSize(mockImageFile);

        imgMock.onload();

        expect(promise).rejects.toEqual("Разрешение изображения должно быть не менее 100x100 пикселей.");

    });

    it('should reject with the correct error message if height or weight > 2048',  () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        const imgMock = {
            width: 2049,
            height: 120,
            onload: null,
            onerror: null,
        };

        const createObjectURLMock = jest.fn().mockReturnValue('mockBlobURL');

        global.URL.createObjectURL = createObjectURLMock;
        global.document.createElement = jest.fn().mockReturnValue(imgMock);

        const mockImageFile = new File([''], 'mockImageFile.jpg', { type: 'image/jpeg' });

        const promise = instance.checkImageSize(mockImageFile);

        imgMock.onload();

        expect(promise).rejects.toEqual("Разрешение изображения не должно превышать 2к пикселей");

    });

    it('should receive user information on successful API calls', async () => {
        const wrapper = shallow(<ChatModule room_name="exampleRoom" />);
        const instance = wrapper.instance();

        // Мокируем успешные вызовы API
        mock.onGet(get_user_from_token).reply(200, { username: 'testUser' });
        mock.onPut(put_user_into_room+"/"+'exampleRoom').reply(200);
        mock.onGet(get_room+"/"+'exampleRoom').reply(200, { members: [{username: "firstUser"}], room_name: 'exampleRoom' });

        // Вызываем метод componentDidMount
        wrapper.instance().componentDidMount();

        await new Promise(resolve => setImmediate(resolve));

        // Проверяем, что состояние компонента изменено корректно
        expect(instance.state.currentUser).toEqual('testUser');
        expect(instance.state.members).toEqual([{username: "firstUser"}]);
        expect(instance.state.room_name).toEqual('exampleRoom');
        expect(instance.state.isLoaded).toEqual(true);

    });

    it('should call onClickHandler on "Enter" key press', () => {
        const wrapper = shallow(<ChatModule />);
        const instance = wrapper.instance();

        jest.spyOn(instance, 'onClickHandler');

        // Создаем фейковое событие с keyCode 13 (клавиша Enter)
        const enterKeyEvent = { keyCode: 13, preventDefault: jest.fn() };

        // Вызываем метод onEnterHandler с фейковым событием
        instance.onEnterHandler(enterKeyEvent);

        // Проверяем, был ли вызван preventDefault
        expect(enterKeyEvent.preventDefault).toHaveBeenCalled();

        // Проверяем, был ли вызван onClickHandler
        expect(instance.onClickHandler).toHaveBeenCalledWith(enterKeyEvent);
    });
});