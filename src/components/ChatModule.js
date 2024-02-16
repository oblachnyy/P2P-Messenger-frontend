import React from "react";
import { animateScroll } from "react-scroll";
import EmojiPicker from "emoji-picker-react";
import EmojiConverter from "emoji-js";
import SentimentVerySatisfiedIcon from "@material-ui/icons/SentimentVerySatisfied";
import VideoCallIcon from "@material-ui/icons/VideoCall";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { Redirect } from "react-router-dom";
import Chip from "@material-ui/core/Chip";
import Avatar from "@material-ui/core/Avatar";

import {
    Box,
    Button,
    Row,
    Stack,
    defaultTheme,
    fontSizes,
} from "luxor-component-library";
import { get_room, put_user_into_room } from "../api/rooms";
import { get_user_from_token } from "../api/auth";
import axios from "axios";

var jsemoji = new EmojiConverter();
jsemoji.replace_mode = "unified";
jsemoji.allow_native = true;
var client = null;

function checkWebSocket(username, roomname) {
    if (client === null || client.readyState === WebSocket.CLOSED) {
        client = new WebSocket(
            "ws://localhost:8000/ws/" + roomname + "/" + username
        );
    }
    return client;
}

class ChatModule extends React.Component {
    constructor(props) {
        super(props);
        this.messagesEndRef = React.createRef();
        this.state = {
            room: {},
            openVideoChat: false,
            isLoaded: false,
            openEmoji: false,
            currentUser: this.props.user,
            message_draft: "",
            messages: [],
            members: [],
            membersCount: 0,
            isButtonDisabled: true,
            selectedMediaFile: null,
        };
        this.checkWebSocketConnection = this.checkWebSocketConnection.bind(this);
        this.onClickHandler = this.onClickHandler.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.onEnterHandler = this.onEnterHandler.bind(this);
        this.onOpenEmoji = this.onOpenEmoji.bind(this);
        this.onEmojiSelection = this.onEmojiSelection.bind(this);
        this.onOpenVideoChat = this.onOpenVideoChat.bind(this);
        this.onAttachFile = this.onAttachFile.bind(this);
    }

    onInputChange(event) {
        const messageDraft = event.target.value;
        if (messageDraft.length <= 4096) {
            this.setState({
                message_draft: messageDraft,
                isButtonDisabled: !messageDraft.trim(),
            });
        }
    }

    checkWebSocketConnection() {
        if (client === null || client.readyState === WebSocket.CLOSED) {
            client = new WebSocket(
                "ws://localhost:8000/ws/" +
                this.state.room_name +
                "/" +
                this.state.currentUser
            );
        }
    }

    sendMessageToChat = (message) => {
        const messageObj = {
            type: "text",
            message: message,
            user: { username: this.state.currentUser },
            room_name: this.state.room_name,
        };

        if (client !== null) {
            client.send(JSON.stringify(messageObj));
        } else {
            client = checkWebSocket(this.state.currentUser, this.state.room_name);
            client.send(JSON.stringify(messageObj));
        }
    };

    onOpenVideoChat() {
        const waitingMessage = "Пользователь ожидает в видеочате. Пожалуйста, подключитесь!";
        this.sendMessageToChat(waitingMessage);
        this.setState({ openVideoChat: true });
    }

    scrollToBottom() {
        animateScroll.scrollToBottom({
            containerId: "message-list",
            duration: "1ms",
        });
    }

    onOpenEmoji() {
        let currentState = this.state.openEmoji;
        this.setState({ openEmoji: !currentState });
    }

    onEmojiSelection(emoji_code, emoji_data) {
        let e = emoji_data.emoji;
        let _message =
            this.state.message_draft === undefined ? "" : this.state.message_draft;
        let updatedMessage = _message + e;

        if (updatedMessage.length <= 4096) {
            this.setState({
                message_draft: updatedMessage,
                isButtonDisabled: !updatedMessage.trim(),
            });
        } else {
            console.warn("Превышен лимит символов после добавления смайлика.");
        }

    }

    checkImageSize(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const width = img.width;
                const height = img.height;

                // Проверка на минимальное разрешение 100x100 пикселей
                if (width < 100 || height < 100) {
                    this.showError("Разрешение изображения должно быть не менее 100x100 пикселей.");
                    reject("Разрешение изображения должно быть не менее 100x100 пикселей.");
                }

                // Проверка на максимальное разрешение 2048x2048 пикселей
                if (width > 2048 || height > 2048) {
                    this.showError("Разрешение изображения не должно превышать 2к пикселей");
                    reject("Разрешение изображения не должно превышать 2к пикселей");
                }

                resolve();
            };
            img.onerror = () => {
                this.showError("Ошибка при загрузки изображения.");
                reject("Ошибка при загрузки изображения.");
            };
            img.src = URL.createObjectURL(file);
        });
    }

    onAttachFile = async () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".jpg,.png,.jpeg,.webp,.gif,.mp4,.avi,.webm,.mp3,.wav";
        const maxAudioFileSize = 8 * 1024 * 1024; // 8 MB
        const maxImageFileSize = 10 * 1024 * 1024; // 10 MB
        const maxVideoFileSize = 50 * 1024 * 1024; // 50 MB

        fileInput.addEventListener("change", async (e) => {
            const files = e.target.files;
            const selectedFile = files[0];
            if (selectedFile) {
                try {
                    const fileType = e.target.files[0].type;
                    const fileSize = selectedFile.size;
                    // Проверка на разрешенный MIME-тип
                    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg'];
                    if (!allowedMimeTypes.includes(fileType)) {
                        this.showError('Неразрешенный тип файла.');
                        console.log('Фактический MIME-тип файла:', fileType);
                        return;
                    }

                    if (selectedFile.type.startsWith('audio/') && fileSize > maxAudioFileSize) {
                        this.showError('Размер аудиофайла превышает максимально допустимый размер (8 MB).');
                        return;
                    }

                    if (selectedFile.type.startsWith('video/') && fileSize > maxVideoFileSize) {
                        this.showError('Размер видео превышает максимально допустимый размер (50 MB).');
                        return;
                    }

                    if (selectedFile.type.startsWith('image/') && fileSize > maxImageFileSize) {
                        this.showError('Размер изображения превышает максимально допустимый размер (10 MB).');
                        return;
                    }

                    if (selectedFile.type.startsWith("image/")) {
                        await this.checkImageSize(selectedFile);
                    }

                    if (selectedFile.type.startsWith("video/")) {
                        this.isVideoFormatAllowed(selectedFile).then((isAllowed) => {
                            if (!isAllowed) {
                                this.showError("Данный формат видео не поддерживается");
                            }
                            else{
                                this.setState({ selectedMediaFile: selectedFile, isButtonDisabled: false });
                            }
                        });
                    }
                    else{
                        this.setState({ selectedMediaFile: selectedFile, isButtonDisabled: false });
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });

        fileInput.click();
    }

    showError(message) {
        alert('Ошибка: ' + message);
    }

    isVideoFormatAllowed(file) {
        const allowedFormats = ["1:1", "4:3", "16:9", "16:10"];

        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);

            video.onloadedmetadata = () => {
                const width = video.videoWidth;
                const height = video.videoHeight;

                // Рассчитываем соотношение сторон
                const aspectRatio = width / height;

                // Проверяем, разрешено ли соотношение сторон
                const isAllowed = allowedFormats.some((format) => {
                    const [allowedWidth, allowedHeight] = format.split(":").map(Number);
                    return Math.abs((width / height) - (allowedWidth / allowedHeight)) < 0.01;
                });

                resolve(isAllowed);
            };
        });
    }

    componentDidMount() {
        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${token}`,
            },
        });
        // Fetch user info and instantiates websocket
        instance
            .get(get_user_from_token)
            .then((res) => {
                this.setState({
                    currentUser: res.data.username,
                    user: res.data,
                });
                instance
                    .put(
                        put_user_into_room + "/" + decodeURIComponent(this.props.room_name)
                    )
                    .then(() => {
                        instance
                            .get(get_room + "/" + decodeURIComponent(this.props.room_name))
                            .then((response) => {
                                this.setState({
                                    ...response.data,
                                    members: response.data.members,
                                    isLoaded: true,
                                    membersCount: response.data.members.length,
                                }, () => {
                                    this.scrollToBottom();
                                });
                                console.log("Connecting Websocket");
                                client = checkWebSocket(
                                    res.data.username,
                                    response.data.room_name
                                );
                                client.onopen = () => {
                                    this.setState({ isLoaded: true }, this.scrollToBottom);
                                    console.log("WebSocket Client Connected");
                                };
                                client.onclose = () => {
                                    console.log("Websocket Disconnected");
                                    client.close();
                                };
                                client.onerror = (err) => {
                                    console.error(
                                        "Socket encountered error: ",
                                        err.message,
                                        "Closing socket"
                                    );
                                    client.close();
                                };
                                client.onmessage = (event) => {
                                    let message = JSON.parse(event.data);
                                    if (
                                        message.hasOwnProperty("type") &&
                                        (message.type === "dismissal" ||
                                            message.type === "entrance")
                                    ) {
                                        if (message.hasOwnProperty("new_room_obj") && Array.isArray(message.new_room_obj)) {
                                            console.log(...message.new_room_obj);
                                            this.setState({
                                                ...message.new_room_obj,
                                            });
                                        } else {
                                            console.error("Invalid or non-iterable new_room_obj in the message");
                                        }
                                    } else {
                                        let message_body = {
                                            message: message["message"],
                                            media_file_url: message["media_file_url"],
                                            user: message["user"],
                                        };
                                        let messages_arr = this.state.messages;
                                        messages_arr.push(message_body);
                                        this.setState(
                                            { messages: messages_arr },
                                            this.scrollToBottom
                                        );
                                        console.log(this.state.messages);
                                    }
                                };
                            })
                            .catch((err) => {
                                localStorage.removeItem("token");
                                console.error("ERROR FETCHING ROOM\n" + err);
                            });
                    })
                    .catch((err) => {
                        console.error("Error adding user to room\n" + err);
                    });
            })
            .catch((err) => {
                localStorage.removeItem("token");
                console.error("ERROR FETCHING CURRENT USER\n" + err);
            });
    }

    onEnterHandler = (event) => {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Trigger the button element with a click
            event.preventDefault();
            this.onClickHandler(event);
        }
    };

    onClickHandler(event) {
        event.preventDefault();
        const input = this.state.message_draft;

        if (input.trim().length > 0 || this.state.selectedMediaFile) {
            if (this.state.selectedMediaFile) {
                this.handleMediaFile(input);
            } else {
                const messageObj = {
                    message: input,
                    user: { username: this.state.currentUser },
                    room_name: this.state.room_name,
                };

                if (client !== null && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(messageObj));
                    this.setState({ message_draft: "", isButtonDisabled: true, selectedMediaFile: null }, this.scrollToBottom);
                } else {
                    client = checkWebSocket(this.state.currentUser, this.state.room_name);
                    client.send(JSON.stringify(messageObj));
                    this.setState({ message_draft: "", isButtonDisabled: true, selectedMediaFile: null }, this.scrollToBottom);
                }
            }
        }
    }

    handleMediaFile(message) {
        const selectedFile = this.state.selectedMediaFile;
        const reader = new FileReader();

        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            const messageObj = {
                type: "file",
                content: base64Data,
                message: message,
                fileType: selectedFile.type,
                user: { username: this.state.currentUser },
                room_name: this.state.room_name,
            };

            if (client !== null && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageObj));
                this.setState({ message_draft: "", isButtonDisabled: true, selectedMediaFile: null }, this.scrollToBottom);
            } else {
                client = checkWebSocket(this.state.currentUser, this.state.room_name);
                client.send(JSON.stringify(messageObj));
                this.setState({ message_draft: "", isButtonDisabled: true, selectedMediaFile: null }, this.scrollToBottom);
            }
        };

        reader.readAsDataURL(selectedFile);
    }

    render() {
        const input_text_style = {
            padding: "10px",
            paddingLeft: "25px",
            paddingRight: "25px",
            width: "600px",
            borderRadius: "3em",
            outline: "none",
            border: `2px solid ${defaultTheme.palette.error.main}`,
            fontWeight: 400,
            fontSize: fontSizes.medium,
            fontFamily: defaultTheme.typography.primaryFontFamily,
            color: defaultTheme.palette.grey[400],
        };
        const {
            isLoaded,
            messages,
            members,
            openVideoChat,
            room_name,
        } = this.state;
        if (!isLoaded) {
            return (
                <Box
                    margin="xlarge"
                    padding="large"
                    width="600px"
                    height="600px"
                    roundedCorners
                    backgroundColor={defaultTheme.palette.secondary.light}
                >
                    <h1>Loading...</h1>
                </Box>
            );
        } else if (openVideoChat) {
            return <Redirect push to={"/video/" + room_name} />;
        } else {
            return (
                <Row width="100%">
                    <Stack width="800px">
                        <Box
                            padding="medium"
                            roundedCorners
                            style={{
                                overflow: "scroll",
                                height: "600px",
                                width: "800px",
                            }}
                            id="message-list"
                        >
                            <Stack space="medium" width="800px">
                                {messages.map((message, index) => {
                                    return (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: message.user.username === this.state.currentUser ? "row" : "row-reverse",
                                                justifyContent: message.user.username === this.state.currentUser ? "flex-end" : "flex-start",
                                            }}
                                            key={index}
                                        >
                                            {message.media_file_url ? (
                                                message.media_file_url.endsWith(".mp4") ? (
                                                    <div>
                                                        <video controls style={{ maxWidth: "200px", maxHeight: "200px" }}>
                                                            <source src={message.media_file_url} type="video/mp4" />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>
                                                ) : message.media_file_url.endsWith(".mp3") ? (
                                                    <div>
                                                        <audio controls>
                                                            <source src={message.media_file_url} type="audio/mpeg" />
                                                            Your browser does not support the audio tag.
                                                        </audio>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <img src={message.media_file_url} alt="uploaded file" style={{ maxWidth: "250px", maxHeight: "250px" }} />
                                                    </div>
                                                )
                                            ) : null}
                                            {message.message.trim() !== '' && (
                                                <Box
                                                    marginX="large"
                                                    padding="small"
                                                    backgroundColor={
                                                        message.user.username === this.state.currentUser
                                                            ? defaultTheme.palette.error.main
                                                            : defaultTheme.palette.primary.main
                                                    }
                                                    color={defaultTheme.palette.common.white}
                                                    roundedCorners
                                                    marginBottom="small"
                                                    style={{
                                                        float:
                                                            message.user.username === this.state.currentUser
                                                                ? "right"
                                                                : "left",
                                                        maxWidth: "80%",
                                                        wordWrap: "break-word",
                                                    }}
                                                    textAlign={
                                                        message.user.username === this.state.currentUser
                                                            ? "right"
                                                            : "left"
                                                    }
                                                >
                                                    {message.message}
                                                </Box>
                                            )}
                                            <Box
                                                padding="small"
                                                style={{
                                                    float:
                                                        message.user.username === this.state.currentUser
                                                            ? "right"
                                                            : "left",
                                                }}
                                                textAlign={
                                                    message.user.username === this.state.currentUser
                                                        ? "right"
                                                        : "left"
                                                }
                                            >
                                                {message.user.username}
                                            </Box>
                                        </div>
                                    );
                                })}

                            </Stack>
                        </Box>
                        <Row width="800px" padding="medium" space="small">
                            <Box padding="small">
                                <input
                                    id="messageText"
                                    style={input_text_style}
                                    value={this.state.message_draft}
                                    onChange={this.onInputChange}
                                    onFocus={this.checkWebSocketConnection}
                                    onKeyUp={(e) => this.onEnterHandler(e)}
                                    autoComplete="off"
                                />
                            </Box>
                            <Row
                                paddingY="small"
                                width="400px"
                                style={{position: "relative"}}
                            >
                                <Box
                                    style={{
                                        display: this.state.openEmoji ? "block" : "none",
                                        position: "absolute",
                                        bottom: "0",
                                        left: "0",
                                        marginBottom: "70px",
                                    }}
                                >
                                    <EmojiPicker
                                        preload
                                        disableDiversityPicker
                                        onEmojiClick={this.onEmojiSelection}
                                    />
                                </Box>
                                <div style={{display: "flex", alignItems: "center", flexWrap: "wrap"}}>
                                    {this.state.selectedMediaFile && (
                                        <div style={{marginRight: "5px"}}>
                                            {this.state.selectedMediaFile.name}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    color="error"
                                    size="small"
                                    style={{
                                        marginRight: "10px",
                                        border: `2px solid ${defaultTheme.palette.error.main}`,
                                    }}
                                    onClick={this.onAttachFile}
                                    text={<AttachFileIcon/>}
                                />
                                <Button
                                    variant="outline"
                                    color="error"
                                    size="small"
                                    style={{
                                        marginRight: "10px",
                                        border: `2px solid ${defaultTheme.palette.error.main}`,
                                    }}
                                    onClick={this.onOpenEmoji}
                                    text={<SentimentVerySatisfiedIcon/>}
                                />
                                <Button
                                    variant="outline"
                                    color="error"
                                    size="small"
                                    style={{
                                        marginRight: "10px",
                                        border: `2px solid ${defaultTheme.palette.error.main}`,
                                    }}
                                    onClick={this.onOpenVideoChat}
                                    text={<VideoCallIcon/>}
                                />
                                <Button
                                    variant="outline"
                                    color="primary"
                                    size="medium"
                                    text="Send"
                                    onClick={this.onClickHandler}
                                    disabled={this.state.isButtonDisabled}
                                />
                            </Row>
                        </Row>
                    </Stack>
                    <Box
                        padding="medium"
                        roundedCorners
                        style={{
                            overflow: "scroll",
                            height: "600px",
                            width: "800px",
                        }}
                    >
                        <Stack space="small">
                            <Box padding="small" color={defaultTheme.palette.common.black}>
                                Number of members ({this.state.membersCount})
                            </Box>
                            <Box>
                                <h1>Room Members</h1>
                            </Box>
                            {members.map((member, index) => {
                                return (
                                    <Box
                                        padding="small"
                                        color={defaultTheme.palette.common.black}
                                        marginBottom="small"
                                        textAlign="center"
                                        key={index}
                                        roundedCorners
                                    >
                                        <Chip
                                            avatar={<Avatar alt="Natacha" src={member.image_url ? member.image_url : 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png'} />}
                                            label={member.username}
                                            variant="outlined"
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                </Row>
            );
        }
    }
}

export {ChatModule};