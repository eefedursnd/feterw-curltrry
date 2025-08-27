export type ApplicationStatus =
    | 'draft'
    | 'submitted'
    | 'in_review'
    | 'approved'
    | 'rejected';

export type InputType =
    | 'short_text'
    | 'long_text'
    | 'select'
    | 'checkbox';

export interface Position {
    id: string;
    title: string;
    description: string;
    active: boolean;
    questions: Question[];
}

export interface Question {
    id: string;
    title: string;
    subtitle: string;
    input_type: InputType;
    required: boolean;
    options: string[];
    sort_order: number;
}

export interface Application {
    id: number;
    user_id: number;
    position_id: string;
    status: ApplicationStatus;
    started_at: string;
    last_updated_at: string;
    submitted_at: string | null;
    expires_at: string;
    time_to_complete: number; // Time in seconds
    reviewed_by: number | null;
    reviewed_at: string | null;
    feedback_note: string;
    responses: Response[];

    position_title?: string;
    position_description?: string;
}

export interface Response {
    id: number;
    application_id: number;
    question_id: string;
    answer: string;
    time_to_answer: number; // Time in seconds
    created_at: string;
    updated_at: string;
}

export interface ApplicationSession {
    application_id: number;
    user_id: number;
    position_id: string;
    current_question: number;
    answers: Record<string, string>;
    time_per_question: Record<string, number>;
    start_time: string;
    last_active_time: string;
    expires_at: string;
}

export interface EnrichedApplication {
    application: Application;
    applicant: {
        uid: number;
        username: string;
        display_name: string;
        avatar_url?: string;
        member_since: string;
    };
    position: Position;
    responses: EnrichedResponse[];
    reviewer?: {
        uid: number;
        username: string;
        display_name: string;
    };
}

export interface EnrichedResponse {
    question_id: string;
    question_title: string;
    question_subtitle: string;
    answer: string;
    time_to_answer: number;
}

export interface StaffApplicationListItem extends Application {
    username: string;
    display_name: string;
    position_title: string;
    reviewer_username?: string;
    reviewer_display_name?: string;
}