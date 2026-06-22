const Avatar = ({ user, size = 9 }) => {
  const dimension = `h-${size} w-${size}`;
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name || ''}
        className={`${dimension} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${dimension} rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0`}>
      {user?.name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

export default Avatar;