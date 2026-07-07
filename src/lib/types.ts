export type Member = {
  id: string;
  member_id: string | null;
  first_name: string;
  surname: string;
  cellphone: string;
  gender: string;
  age: string;
  province: string;
  region: string;
  branch: string;
  employment_status: string;
  job_title: string;
  study_field: string;
  school_grade: string;
  zone_leader: string;
  pastor: string;
  status: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  registered_at: string | null;
  created_at: string;
};

export type Ministry = {
  id: string;
  name: string;
  leader: string;
  created_at: string;
};

export type ServiceDepartment = {
  id: string;
  name: string;
  leader: string;
  created_at: string;
};

export type MemberMinistry = {
  member_id: string;
  ministry_id: string;
};

export type MemberServiceDepartment = {
  member_id: string;
  service_department_id: string;
};

export type Attendance = {
  id: string;
  member_id: string | null;
  attendance_date: string | null;
  service: string;
  name: string;
  status: string;
  created_at: string;
};

export type Tithing = {
  id: string;
  member_id: string | null;
  tithe_date: string | null;
  name: string;
  surname: string;
  cellphone: string;
  created_at: string;
};

export type EventRecord = {
  id: string;
  member_id: string | null;
  member_name: string;
  cellphone: string;
  event_type: string;
  event_date: string | null;
  status: string;
  notes: string;
  created_at: string;
};

export type IntentionalContact = {
  id: string;
  zone_leader: string;
  branch: string;
  visit_date: string | null;
  person_visited: string;
  reason_for_visit: string;
  address: string;
  contact_number: string;
  created_at: string;
};

export type WhatsappLog = {
  id: string;
  member_id: string | null;
  recipient_name: string;
  phone: string;
  status: string;
  message: string;
  sent_at: string;
};
