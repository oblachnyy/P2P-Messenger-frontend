import React from "react";
import axios from "axios";
import {post_room, get_room, get_rooms, post_favorite} from "../../api/rooms";
import {get_user_from_token} from "../../api/auth";
import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import Chip from "@material-ui/core/Chip";
import {Box, Button, defaultTheme, fontSizes, Row, Stack,} from "luxor-component-library";
import {Redirect} from "react-router-dom";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 1,
            roomsPerPage: 10,
            rooms: [],
            selected_rooms: [],
            currentUser: null,
            roomNav: false,
            new_room_name: "",
            selected_room_name:"",
            errorMessage: "",
        };
        this.onNewRoomChange = this.onNewRoomChange.bind(this);
        this.onSelectedRoomChange = this.onSelectedRoomChange.bind(this);
        this.addFavorite = this.addFavorite.bind(this);
        this.removeFavorite = this.removeFavorite.bind(this);

        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
    }

    handleFavoriteRequest(method, e, room_name) {
        e.preventDefault();
        let is_chosen = false;
        if (method === 'add') {
            is_chosen = true;
        }
        let body = {
            "room_name": room_name,
            "is_chosen": is_chosen
        };
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .post(post_favorite, body)
            .then((response) => {
                const updatedRooms = this.state.rooms;
                console.log("Заранее: ", updatedRooms);
                updatedRooms.forEach(room => {
                    if (room.room_name === room_name) {
                        room.is_favorites = method === 'add';
                        console.log(room.is_favorites);
                    }
                });
                this.setState({ rooms: updatedRooms });
                console.log(updatedRooms);
            })
            .catch((err) => {
                localStorage.removeItem("token");
                console.log("ERROR FETCHING SINGLE ROOM: \n" + err);
            });
    }

    addFavorite(e, room_name) {
        this.handleFavoriteRequest('add', e, room_name);
    }

    removeFavorite(e, room_name) {
        this.handleFavoriteRequest('remove', e, room_name);
    }

    nextPage(e){
        console.log(this.state.currentPage);
        this.state.currentPage++;
        this.fetchRooms();
        console.log(this.state.currentPage);
    }

    previousPage(e){
        console.log(this.state.currentPage);
        if (this.state.currentPage > 1){
            this.state.currentPage--;
            this.fetchRooms();
        } else{
            console.log("bad");
        }
    }

    fetchRooms() {
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${token}`,
            },
        });

        instance
            .get(get_rooms, { params: { page: this.state.currentPage, limit: this.state.roomsPerPage } })
            .then((response) => {
                this.setState({ rooms: response.data });
            })
            .catch((err) => {
                console.log("ERROR FETCHING ROOMS: \n" + err);
            });
    }

    onNewRoomChange(event) {
        this.setState({ new_room_name: event.target.value });
    }

    onSelectedRoomChange(event) {
        this.setState({ selected_room_name: event.target.value });
    }

    startNewRoomClick(e) {
        const roomName = this.state.new_room_name.trim();
        if (roomName === "") {
            const errorMessage = "Название комнаты не может быть пустым";
            this.setState({ errorMessage });
            return;
        }

        // if (roomName.includes(" ")) {
        //     const errorMessage = "Название комнаты не может быть пустым";
        //     this.setState({ errorMessage });
        //     return;
        // }

        if (roomName.length > 20) {
            const errorMessage = "Название комнаты не может иметь более 20 символов";
            this.setState({ errorMessage });
            return;
        }

        let body = {
            room_name: roomName
        };
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .post(post_room, body)
            .then((response) => {
                if (response.data) {
                    // Добавление в закладки
                    this.addFavorite(e, roomName);
                    console.log(response.data.room_name);
                    // Переход в созданную комнату
                    this.setState({ roomNav: response.data.room_name });
                }
            })
            .catch((err) => {
                const errorMessage = "Название комнаты не должно дублировать название других комнат";
                this.setState({ errorMessage });
                console.log("ERROR FETCHING SINGLE ROOM: \n" + err);
            });
    }

    findRoomByName(e) {
        const roomName = this.state.selected_room_name.trim();
        if (roomName === "") {
            console.log("Error: Room name cannot be empty");
            return;
        }

        if (roomName.includes(" ")) {
            console.log("Error: Room name cannot contain spaces");
            return;
        }

        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance.get(get_rooms + "/" + roomName)
            .then((response) => {
                console.log(response);
                this.setState({ rooms: response.data })
            })
            .catch((error) => {
                console.error("Error fetching room:", error);
            });
    }

    handleRoomClick(e) {
        e.preventDefault();
        let room_name = e.currentTarget.textContent;
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .get(get_room + "/" + room_name)
            .then((response) => {
                if (response.data) {
                    // Проверяем, является ли response.data строкой
                    // const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                    console.log(response.data);
                    console.log(response.data.room_name);
                    this.setState({ roomNav: response.data.room_name });
                }
            })
            .catch((err) => {
                localStorage.removeItem("token");
                console.log("ERROR FETCHING SINGLE ROOM: \n" + err);
            });
    }

    componentDidMount() {
        // Setup redux and snag the current user and bring them into state
        // Fetch all rooms (need to setup credentials from current user)
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .get(get_user_from_token)
            .then((response) => {
                localStorage.setItem("username", response.data.username);
                localStorage.setItem("profilePicURL", response.data.image_url);
                localStorage.setItem("name", response.data.first_name);
                localStorage.setItem("lastname",response.data.last_name);
                localStorage.setItem("surname", response.data.surname);
                this.setState({
                    currentUser: response.data.username,
                });
                instance
                    .get(get_rooms,  {params: {page: this.state.currentPage, limit: this.state.roomsPerPage}})
                    .then((response) => {
                        this.setState({ rooms: response.data });
                        console.log(this.state.rooms)
                    })
                    .catch((err) => {
                        // clear token just in case
                        localStorage.removeItem("token");
                        console.log("ERROR FETCHING ROOMS: \n" + err);
                    });
            })
            .catch((err) => {
                localStorage.removeItem("token");
                console.log("ERROR FETCHING CURRENT USER\n" + err);
            });
    }

    render() {
        const input_text_style = {
            padding: "10px",
            paddingLeft: "25px",
            paddingRight: "25px",
            width: "400px",
            borderRadius: "3em",
            outline: "none",
            border: `2px solid ${defaultTheme.palette.secondary.light}`,
            fontWeight: 400,
            fontSize: fontSizes.medium,
            fontFamily: defaultTheme.typography.primaryFontFamily,
            color: defaultTheme.palette.grey[400],
        };
        const { rooms, roomNav, new_room_name, errorMessage } = this.state;
        const isCreateRoomButtonDisabled = new_room_name.trim() === '';

        if (roomNav && roomNav !== "None") {
            return <Redirect push to={"/dashboard/" + roomNav} />;
        } else {
            return (
                <Box
                    padding="small"
                    paddingY="xlarge"
                    style={{
                        height: "100vh",
                    }}
                    backgroundColor={defaultTheme.palette.grey[100]}
                    color={defaultTheme.palette.common.black}
                    textAlign="center"
                >
                    <Stack
                        space="large"
                        padding="medium"
                        roundedCorners
                        marginX="xxxlarge"
                    >
                        <Box padding="medium">
                            <h1>Добро пожаловать на главную страницу: {this.state.currentUser}</h1>
                        </Box>
                        <Row
                            space="none"
                            width="50%"
                            justifyContent="center"
                            alignItems="center"
                            textAlign="center"
                            style={{ margin: "auto" }}
                        >
                            <Box>
                                <input
                                    id="messageText"
                                    data-testid="roomInput"
                                    style={input_text_style}
                                    value={this.state.new_room_name}
                                    onChange={this.onNewRoomChange}
                                    autoComplete="off"
                                />
                            </Box>
                            <Box>
                                <Button
                                    variant="outline"
                                    size="medium"
                                    color="secondary"
                                    text="Создать комнату"
                                    onClick={(e) => this.startNewRoomClick(e)}
                                    disabled={isCreateRoomButtonDisabled}
                                />
                            </Box>
                        </Row>
                        <Box>
                            <h1>Список комнат</h1>
                            <Row
                                space="none"
                                width="50%"
                                justifyContent="center"
                                alignItems="center"
                                textAlign="center"
                                style={{ margin: "auto" }}
                            >
                                <Box>
                                    <input
                                        id="messageText"
                                        data-testid="searchInput"
                                        style={input_text_style}
                                        value={this.state.selected_room_name}
                                        onChange={this.onSelectedRoomChange}
                                        autoComplete="off"
                                    />
                                </Box>
                                <Box>
                                    <Button
                                        variant="outline"
                                        size="medium"
                                        color="secondary"
                                        text="Поиск комнаты"
                                        onClick={(e) => this.findRoomByName(e)}
                                    />
                                </Box>
                            </Row>
                            <Box
                                textAlign="center"
                                padding="small"
                                style={{ justifyContent: "center", height: "300px" }}
                            >
                                {rooms.map((room) => {
                                    if (room.is_favorites === true) {
                                        return (
                                            <Box margin="small" key={room.id}>
                                                <Chip
                                                    data-testid="TEST1"
                                                    icon={FavoriteIcon}
                                                    onClick={(e) => this.handleRoomClick(e)}
                                                    label={room.room_name}
                                                    id={room.room_name}
                                                    onDelete={(e) =>
                                                        this.removeFavorite(e, room.room_name)
                                                    }
                                                    deleteIcon={<FavoriteIcon />}
                                                />
                                            </Box>
                                        );
                                    } else {
                                        return (
                                            <Box margin="20px" key={room.id}>
                                                <Chip
                                                    data-testid="TEST2"
                                                    icon={FavoriteBorderIcon}
                                                    onClick={(e) => this.handleRoomClick(e)}
                                                    label={room.room_name}
                                                    id={room.room_name}
                                                    onDelete={(e) => this.addFavorite(e, room.room_name)}
                                                    deleteIcon={<FavoriteBorderIcon />}
                                                />
                                            </Box>
                                        );
                                    }
                                })}
                                <Box color="red" padding="small">
                                    {errorMessage !== "" && <p>{errorMessage}</p>}
                                </Box>
                            </Box>
                            <Row>
                                <Box>
                                    <Button
                                        variant="solid"
                                        color="primary"
                                        size="small"
                                        text="Предыдущая страница"
                                        onClick={this.previousPage}
                                    />
                                </Box>
                                <Box>
                                    <Button
                                        variant="outline"
                                        color="primary"
                                        size="small"
                                        text="Следующая страница"
                                        onClick={this.nextPage}
                                    />
                                </Box>
                            </Row>
                        </Box>
                    </Stack>
                </Box>
            );
        }
    }
}

export default Home;
