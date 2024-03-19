import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import Logout from '/src/pages/auth/Logout';

test('Logout component, FS_Logout_1', async () => {
    const localStorageMock = {
        clear: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });

    const history = createMemoryHistory();
    history.push('/logout');

    render(
        <Router history={history}>
            <Logout />
        </Router>
    );

    await waitFor(() => {
        expect(localStorageMock.clear).toHaveBeenCalled();
    });

    await waitFor(() => {
        expect(history.location.pathname).toBe('/login');
    });
});