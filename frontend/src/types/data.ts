export interface DataExport {
    id: number;
    user_id: number;
    status: string; // requested, processing, completed, failed
    file_url: string | null;
    file_name: string | null;
    expires_at: string;
    downloaded_at: string | null;
    requested_at: string;
    completed_at: string | null;
    last_requested_at: string;
  }
  
  export interface DataExportResponse {
    message: string;
    status: string;
    requested_at: string;
    estimated_eta: string;
    export_id: number;
  }
  
  export interface DataExportDownloadRequest {
    export_id: number;
    password: string;
  }
  
  export interface DataExportDownloadResponse {
    download_url: string;
    expires_at: string;
  }