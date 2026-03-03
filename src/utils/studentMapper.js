export const mapStudentFromBackend = (student) => ({
  id: student.id,
  first_name: student.firstName || '',
  last_name: student.lastName || '',
  patronymic: student.middleName || '',
  iin: student.iin || '',
  course: student.course,
  study_form: student.educationForm || '',
  institute: student.faculty || '',
  grant_type: student.grantName || '',
  has_scholarship: student.hasScholarship ? 'Да' : 'Нет',
  scholarship_status: student.hasScholarship ? 'Активна' : 'Неактивна',
  bank_account: student.iban || '',
  notes: student.scholarshipNotes || '',
  curriculum_specialty: student.speciality || ''
})
