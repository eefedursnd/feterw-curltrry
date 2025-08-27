import { 
    FileText, 
    CheckCircle, 
    Clock, 
    Info, 
    XCircle, 
    AlertCircle
  } from 'lucide-react';
  import { ApplicationStatus } from 'haze.bio/types/apply';
  
  interface ApplicationStatusBadgeProps {
    status: ApplicationStatus;
  }
  
  export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
    const getStatusColor = (status: ApplicationStatus) => {
      switch (status) {
        case 'draft':
          return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        case 'submitted':
          return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'in_review':
          return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'approved':
          return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'rejected':
          return 'bg-red-500/10 text-red-400 border-red-500/20';
        default:
          return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      }
    };
  
    const getStatusText = (status: ApplicationStatus) => {
      switch (status) {
        case 'draft':
          return 'Draft';
        case 'submitted':
          return 'Submitted';
        case 'in_review':
          return 'In Review';
        case 'approved':
          return 'Approved';
        case 'rejected':
          return 'Rejected';
        default:
          return 'Unknown';
      }
    };
  
    const getStatusIcon = (status: ApplicationStatus) => {
      switch (status) {
        case 'draft':
          return <FileText size={12} className="mr-1" />;
        case 'submitted':
          return <Clock size={12} className="mr-1" />;
        case 'in_review':
          return <Info size={12} className="mr-1" />;
        case 'approved':
          return <CheckCircle size={12} className="mr-1" />;
        case 'rejected':
          return <XCircle size={12} className="mr-1" />;
        default:
          return <Info size={12} className="mr-1" />;
      }
    };
  
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        {getStatusText(status)}
      </span>
    );
  }