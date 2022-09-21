import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./lobby.css";

const Lobby = () => {
  const [room, setRoom] = useState("");
  const navigate = useNavigate();

  const handleRoom = (e) => setRoom(e.target.value);
  const handleSubmit = (e) => {
    e.preventDefault();

    navigate("/room?room=" + room);
  };

  return (
    <main id={"lobby-container"}>
      <div id={"form-container"}>
        <div id={"form__container__header"}>
          <p>Create OR Join a Room</p>
        </div>
        <div id="form__content__wrapper">
          <form id="join-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={room}
              onChange={handleRoom}
              name="invite_link"
              required
            />
            <input type="submit" value="Join Room" />
          </form>
        </div>
      </div>
    </main>
  );
};

export default Lobby;
