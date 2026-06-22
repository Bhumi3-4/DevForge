import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ProjectCard = ({ project }) => (
  <Link
    to={`/projects/${project._id}`}
    className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
  >
    <div className="flex items-center justify-between">
      <h3 className="text-white font-medium">{project.title}</h3>
      <StatusBadge status={project.status} />
    </div>

    {project.description && (
      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{project.description}</p>
    )}

    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <Users size={12} /> {project.members?.length || 0}/{project.maxMembers} members
      </span>
      {project.isRecruiting && (
        <span className="text-green-400 font-medium">Recruiting</span>
      )}
    </div>

    {project.techStack?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {project.techStack.slice(0, 4).map((tech) => (
          <span key={tech} className="bg-gray-800 px-2 py-0.5 rounded text-gray-400 text-xs">
            {tech}
          </span>
        ))}
      </div>
    )}
  </Link>
);

export default ProjectCard;