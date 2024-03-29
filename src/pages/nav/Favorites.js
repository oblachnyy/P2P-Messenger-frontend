import React from "react";
import axios from "axios";
import {get_rooms, post_room, favorites, get_favorites, get_favorite, get_room, post_favorite} from "../../api/rooms";
import {get_user_from_token} from "../../api/auth";
import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import CancelRoundedIcon from "@material-ui/icons/CancelRounded";
import Chip from "@material-ui/core/Chip";
import {Box, Button, defaultTheme, fontSizes, Row, Stack,} from "luxor-component-library";
import {Redirect} from "react-router-dom";

class Favorites extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 1,
            roomsPerPage: 10,
            globalIndex: -1,
            rooms: [],
            currentUser: null,
            room_id: null,
            is_owner: false,
            roomNav: false,
            selected_room_name: "",
        };
        this.onInputChange = this.onInputChange.bind(this);
        this.onEnterHandler = this.onEnterHandler.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);

        this.handleClick = this.handleClick.bind(this);
        this.removeFavorite = this.removeFavorite.bind(this);

        this.addFavorite = this.addFavorite.bind(this);
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
            .get(get_favorites, { params: { page: this.state.currentPage, limit: this.state.roomsPerPage } })
            .then((response) => {
                this.setState({ rooms: response.data });
            })
            .catch((err) => {
                console.log("ERROR FETCHING ROOMS: \n" + err);
            });
    }

    searchRooms(e) {
        e.preventDefault();
        let room_name = e.currentTarget.textContent;
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${token}`,
            },
        });

        instance
            .get(get_favorite + "/" + room_name, { params: { page: this.state.currentPage, limit: this.state.roomsPerPage } })
            .then((response) => {
                this.setState({ rooms: response.data });
            })
            .catch((err) => {
                console.log("ERROR FETCHING ROOMS: \n" + err);
            });
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
                updatedRooms.forEach(room => {
                    if (room.room_name === room_name) {
                        room.is_favorites = method === 'add';
                    }
                });
                this.setState({rooms: updatedRooms});
            })
            .catch((err) => {
                localStorage.removeItem("token");
                console.log("ERROR FETCHING SINGLE ROOM: \n" + err);
            });
    }

    handleClick(e, room_name, index) {
        e.preventDefault();
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        // Создаем новый массив, исключая удаляемую комнату
        const updatedRooms = this.state.rooms.filter(room => room.room_name !== room_name);

        // Обновляем состояние новым массивом
        this.setState({ rooms: updatedRooms });

        instance.delete(get_room + "/" + room_name)
            .then(() => {
                console.log("Delete room");
                this.fetchRooms()
            })
            .catch((error) => {
                console.error("Error fetching room:", error);
            });
    }


    addFavorite(e, room_name) {
        this.handleFavoriteRequest('add', e, room_name);
    }

    removeFavorite(e, room_name) {
        this.handleFavoriteRequest('remove', e, room_name);
    }

    onInputChange(event) {
        //console.log("Input: " + event.target.value);
        this.setState({ selected_room_name: event.target.value });
    }

    onEnterHandler = (event) => {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Trigger the button element with a click

            this.startNewRoomClick(event);
        }
    };

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
        instance.get(get_favorite + "/" + roomName, { params: { page: this.state.currentPage, limit: this.state.roomsPerPage } })
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
                    //console.log(response.data);
                    this.setState({ roomNav: response.data.room_name });
                }
                console.log(response.data);
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
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .get(get_user_from_token)
            .then((response) => {
                this.setState({
                    currentUser: response.data.username,
                    user: { ...response.data },
                });
                instance
                    .get(get_favorites, { params: { page: this.state.currentPage, limit: this.state.roomsPerPage } })
                    .then((response) => {
                        this.setState({ rooms: response.data });
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
            border: `2px solid ${defaultTheme.palette.error.main}`,
            fontWeight: 400,
            fontSize: fontSizes.medium,
            fontFamily: defaultTheme.typography.primaryFontFamily,
            color: defaultTheme.palette.grey[400],
        };
        const {rooms, roomNav, user} = this.state;
        if (roomNav && roomNav !== "None") {
            return <Redirect push to={"/dashboard/" + roomNav}/>;
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
                            <h1>Избранные комнаты пользователя {this.state.currentUser}</h1>
                        </Box>
                        <Row
                            space="none"
                            width="50%"
                            justifyContent="center"
                            alignItems="center"
                            textAlign="center"
                            style={{margin: "auto"}}
                        >
                            <Box>
                                <input
                                    id="messageText"
                                    style={input_text_style}
                                    value={this.state.selected_room_name}
                                    onChange={this.onInputChange}
                                    onKeyUp={(e) => this.onEnterHandler(e)}
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
                        <Box>
                            <h1>Список комнат</h1>
                            <Stack space="medium">
                                {rooms.map((room, index) => {
                                    if (room.is_favorites === true) {
                                        if (room.is_owner === true){
                                            return (
                                                <Box margin="small" key={room.id}>
                                                    <Chip
                                                        style={{backgroundColor: room.is_owner ? "orange" : null}}
                                                        icon={FavoriteIcon}
                                                        onClick={(e) => this.handleRoomClick(e)}
                                                        label={room.room_name}
                                                        id={room.room_name}
                                                        onDelete={(e) =>
                                                            this.removeFavorite(e, room.room_name)
                                                        }
                                                        deleteIcon={<FavoriteIcon />}
                                                    />
                                                    <Chip
                                                        label="Удалить"
                                                        style={{backgroundColor: room.is_owner ? "orange" : null}}
                                                        variant="outlined"
                                                        id={room.room_name}
                                                        onDelete={(e) =>
                                                            this.handleClick(e, room.room_name, index)
                                                        }
                                                    />
                                                </Box>
                                            );
                                        } else{
                                            return (
                                                <Box margin="small" key={room.id}>
                                                    <Chip
                                                        style={{backgroundColor: room.is_owner ? "orange" : null}}
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
                                        }
                                    } else {
                                        return (
                                            <Box margin="20px" key={room.id}>
                                                <Chip
                                                    style={{backgroundColor: room.is_owner ? "orange" : null}}
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
                            </Stack>
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


export default Favorites;