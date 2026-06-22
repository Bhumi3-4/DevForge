const STATUS_STYLES = {
  open: 'bg-green-500/10 text-green-400',
  'in-progress': 'bg-amber-500/10 text-amber-400',
  completed: 'bg-blue-500/10 text-blue-400',
  archived: 'bg-gray-500/10 text-gray-400',
  todo: 'bg-gray-500/10 text-gray-400',
  review: 'bg-purple-500/10 text-purple-400',
  done: 'bg-green-500/10 text-green-400',
};

const StatusBadge = ({ status }) => (
  <span
    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
      STATUS_STYLES[status] || 'bg-gray-500/10 text-gray-400'
    }`}
  >
    {status?.replace('-', ' ')}
  </span>
);

export default StatusBadge;