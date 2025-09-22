# One piece chat

That app is API for Web Chat based on rooms with One Piece theme. This is a personal study app; It's free to fork, enjoy!

## Business Rules

- [ ] A User can be a member of multiple Rooms.
- [ ] A Room can have many members, but it must have only one Admin.
- [ ] A User can be the admin of multiple Rooms.
- [ ] Messages can only be sent and viewed by Users who are members of the corresponding Room.
- [ ] All messages must be associated with a User (the sender) and a Room.
- [ ] The Admin of a Room has special permissions to manage its members.

## Functional Requirements

### User Management

- [ ] FR1: The system must allow new users to register an account with a unique username and password.
- [ ] FR2: The system must allow registered users to log in and log out securely.
- [ ] FR3: The system must allow users to update their profile information.

### Room Management

- [ ] FR4: The system must allow a user to create a new chat room. The creator of the room is automatically assigned as its Admin.
- [ ] FR5: The system must display a list of all rooms a user is a member of.
- [ ] FR6: The system must allow a user to join a public room.
- [ ] FR7: The system must allow a user to leave a room they are a member of.

### Messaging and Real-Time Chat

- [ ] FR8: The system must allow a user to send text messages within a room.
- [ ] FR9: The system must display new messages in real-time to all members of a room.
- [ ] FR10: The system must display the message history for a given room.

### Admin Functionality

- [ ] FR11: A room Admin must be able to remove any member from their room.
- [ ] FR12: The system must display the Admin's status clearly to all other room members.
