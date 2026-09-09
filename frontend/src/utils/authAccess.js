export function isVerifiedUser(user) {
    return user?.isVerified === true && ["admin", "counselor", "superAdmin"].includes(user.role);
}

export function hasVerifiedSession(isLoggedIn, user) {
    return isLoggedIn === true && isVerifiedUser(user);
}
