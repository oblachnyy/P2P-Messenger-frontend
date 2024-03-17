import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import VideoChatPage from '/src/pages/chat/VideoChatPage';
import { get_user_from_token } from '/src/api/auth';
import {shallow} from "enzyme";

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const mock = new MockAdapter(axios);

describe('VideoChatPage Component', () => {
    afterEach(() => {
        mock.reset();
    });

    it('handles error during user data loading', async () => {
        mock.onGet(get_user_from_token).reply(500, { error: 'Internal Server Error' });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        render(<VideoChatPage />);

        // Ждем завершения обработки ошибки и исчезновения сообщения о загрузке
        await waitFor(async () => {
            const loadingElement = screen.queryByText(/Loading/i);

            if (loadingElement) {
                return false;
            }

            // Если элемент загрузки не существует, продолжаем выполнение
            return true;
        }, { timeout: 5000 });

        // Проверка, если сообщение об ошибке записано в консоль
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR FETCHING CURRENT USER'));

        consoleSpy.mockRestore();
    });

    it('sets state correctly on successful API response', async () => {
        const mockResponse = { data: { username: 'testUser123' } };
        const axiosMock = jest.spyOn(axios, 'create').mockImplementation(() => ({
            get: jest.fn().mockResolvedValue(mockResponse)
        }));

        const wrapper = shallow(<VideoChatPage />);

        await wrapper.instance().componentDidMount();

        await wrapper.update();
        expect(wrapper.state('currentUser')).toEqual(mockResponse.data.username);
        expect(wrapper.state('isLoaded')).toBe(true);

        axiosMock.mockRestore();
    });
});
