# Security Specification for Typing Game

## 1. Data Invariants
- A UserProfile can only be read by signed-in users. Writing to a UserProfile is restricted to the owner of that profile (`request.auth.uid == userId`).
- A Room can be created by any signed-in user, who becomes the `hostId`.
- A player in a room can only modify their own entry in the `players` map (progress, WPM, accuracy, completion status).
- Only the room host (`hostId`) can change the room's status, countdown, or update bot entries.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create/update a user profile with `userId` of another user. (REJECTED)
2. **Stat Overwrite**: A user trying to set their WPM to 999 or games won to 5000 in a single operation without verification. (REJECTED)
3. **Ghost Fields**: Attempt to write a room with an arbitrary "cheat" field. (REJECTED)
4. **Room Hijacking**: A non-host user trying to change the room state from `waiting` to `active`. (REJECTED)
5. **Score Injection**: A player modifying another player's progress or WPM. (REJECTED)
6. **Time Spoofing**: Submitting client-generated timestamps instead of Server Timestamps for `createdAt`. (REJECTED)
7. **Room Spoofing**: Injecting massive payload as a room ID. (REJECTED)
8. **Bot Spoofing**: A non-host user trying to add/modify bot entries. (REJECTED)
9. **State Shortcutting**: Skipping the starting sequence and going straight to active or finished. (REJECTED)
10. **Duplicate Player**: Overwriting another player's key in the players map. (REJECTED)
11. **Negative stats**: Attempt to set negative average WPM or games played. (REJECTED)
12. **Blanket Querying**: Attempting to query the entire rooms database without filter limits or security constraints. (REJECTED)

## 3. Test Runner
We will enforce these through our `firestore.rules`.
