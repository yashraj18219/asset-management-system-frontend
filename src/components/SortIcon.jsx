import '../App.css';

export default function SortIcon({ direction }) {
  if (direction === 'asc') return <span className="sort-icon" style={{ opacity: 1 }}>▲</span>;
  if (direction === 'desc') return <span className="sort-icon" style={{ opacity: 1 }}>▼</span>;
  return <span className="sort-icon" style={{ opacity: 0.4 }}>⇅</span>;
}
