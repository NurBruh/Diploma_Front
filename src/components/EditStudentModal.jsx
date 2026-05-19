import React, { useState, useEffect } from 'react';
import { MdWarning } from 'react-icons/md';
import '../css/EditStudentModal.css';

const TABS = [
  { key: 'main', label: 'Основные' },
  { key: 'requisites', label: 'Реквизиты' },
  { key: 'other', label: 'Прочее' },
];

const DIFF_FIELD_MAP = {
  'ФИО': ['lastName', 'firstName', 'patronymic'],
  'Курс': ['courseNumber'],
  'Форма обучения': ['studyFormId'],
  'Институт': ['facultyId'],
  'Специализация': ['specializationId'],
  'Тип оплаты': ['paymentFormId'],
  'Тип гранта': ['grantType'],
  'ИИК (Р/С)': ['iic'],
  'БИК': ['bic'],
};

const NUMBER_FIELDS = new Set([
  'universityId',
  'studentId',
  'nationId',
  'studyFormId',
  'studyCalendarId',
  'paymentFormId',
  'studyLanguageId',
  'professionId',
  'courseNumber',
  'isMarried',
  'isStudent',
  'gpa',
  'currentCreditsSum',
  'residence',
  'sitizenshipId',
  'dormState',
  'fromId',
  'contractId',
  'specializationId',
  'icType',
  'facultyId',
  'sexId',
  'sumPoints',
  'sumPointsCreative',
  'grantType',
  'academicMobility',
  'birthPlaceCatoId',
  'livingPlaceCatoId',
  'registrationPlaceCatoId',
  'naselennyiPunktAttestataCatoId',
  'enterExamType',
  'fundingId',
  'bankId',
]);

const BOOLEAN_FIELDS = new Set([
  'hasExcellent',
  'isInRetire',
  'local',
  'altynBelgi',
  'endCollege',
  'endHighSchool',
  'endSchool',
  'incorrectIin',
]);

const DATE_FIELDS = new Set([
  'birthDate',
  'startDate',
  'icDate',
  'dataVydachiAttestata',
  'dataVydachiDiploma',
  'dateDocEducation',
  'enrollOrderDate',
  'updateDate',
]);

const toInputValue = (value, type) => {
  if (value === null || value === undefined) return '';
  if (type === 'date') return String(value).slice(0, 10);
  return String(value);
};

const toPayloadValue = (name, value) => {
  if (NUMBER_FIELDS.has(name)) {
    if (value === '' || value === null || value === undefined) return null;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  }

  if (BOOLEAN_FIELDS.has(name)) {
    if (value === '' || value === null || value === undefined) return null;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return null;
  }

  if (DATE_FIELDS.has(name)) {
    if (!value) return null;
    return String(value).slice(0, 10);
  }

  return value;
};

const buildPayload = (form) => Object.fromEntries(
  Object.entries(form).map(([name, value]) => [name, toPayloadValue(name, value)])
);

const EditFormContext = React.createContext(null);

const Field = ({ label, name, type = 'text', options = [], children }) => {
  const context = React.useContext(EditFormContext);
  if (!context) return null;

  const { form, handleChange, isDiffField } = context;
  const hasDiff = isDiffField(name);

  return (
    <div className={`esm-row${hasDiff ? ' esm-row--diff' : ''}`}>
      <label>
        {label}
        {hasDiff && <MdWarning size={14} className="esm-diff-icon" title="Различается с ЕПВО" />}
      </label>
      {children || (
        type === 'select' ? (
          <select name={name} data-field-type={type} value={toInputValue(form[name], type)} onChange={handleChange}>
            <option value="">—</option>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            name={name}
            type={type === 'number' ? 'text' : type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            value={toInputValue(form[name], type)}
            onChange={handleChange}
          />
        )
      )}
    </div>
  );
};

const EditStudentModal = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    if (item?.data) {
      setForm({ ...item.data });
    }
  }, [item]);

  if (!item) return null;

  const diffFieldNames = item.differentFields || [];
  const isDiffField = (fieldName) => {
    for (const [label, fields] of Object.entries(DIFF_FIELD_MAP)) {
      if (diffFieldNames.includes(label) && fields.includes(fieldName)) return true;
    }
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...item, data: buildPayload(form) });
  };

  return (
    <div className="esm-overlay" onClick={onClose}>
      <div className="esm-modal esm-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="esm-header">
          <h3>Редактирование студента</h3>
          <div className="esm-subtitle">
            {item.fullName} · ИИН: {item.iinPlt}
            {item.isNew && <span className="esm-badge-new">Новый (нет в ЕПВО)</span>}
          </div>
          <button className="esm-close" onClick={onClose}>×</button>
        </div>

        <div className="esm-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`esm-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="esm-body">
          <EditFormContext.Provider value={{ form, handleChange, isDiffField }}>
            {activeTab === 'main' && (
              <div className="esm-tab-content">
                <div className="esm-grid">
                  <Field label="Фамилия" name="lastName" />
                  <Field label="Имя" name="firstName" />
                  <Field label="Отчество" name="patronymic" />
                  <Field label="ИИН" name="iinPlt" />
                  <Field label="Курс" name="courseNumber" type="number" />
                  <Field label="Факультет ID" name="facultyId" type="number" />
                  <Field label="Специализация ID" name="specializationId" type="number" />
                  <Field label="Специальность ID" name="professionId" type="number" />
                  <Field label="Форма обучения ID" name="studyFormId" type="number" />
                  <Field label="Форма оплаты" name="paymentFormId" type="select" options={[
                    { value: 1, label: 'Платник' },
                    { value: 2, label: 'Стипендия' },
                  ]} />
                  <Field label="Тип гранта" name="grantType" type="select" options={[
                    { value: -4, label: 'Государственный грант' },
                    { value: -7, label: 'Из собственных средств' },
                    { value: -6, label: 'Трехсторонняя форма обучения' },
                  ]} />
                  <Field label="Язык обучения ID" name="studyLanguageId" type="number" />
                  <Field label="Пол (1-жен, 2-муж)" name="sexId" type="number" />
                  <Field label="Национальность ID" name="nationId" type="number" />
                  <Field label="Семейное положение ID" name="isMarried" type="number" />
                  <Field label="GPA" name="gpa" type="number" />
                  <Field label="Сумма кредитов" name="currentCreditsSum" type="number" />
                  <Field label="Дата рождения" name="birthDate" type="date" />
                  <Field label="Дата поступления" name="startDate" type="date" />
                  <Field label="Дата приказа о зачислении" name="enrollOrderDate" type="date" />
                </div>
              </div>
            )}

            {activeTab === 'requisites' && (
              <div className="esm-tab-content">
                <div className="esm-grid esm-grid--2col">
                  <Field label="ИИК (Р/С)" name="iic" />
                  <Field label="БИК" name="bic" />
                </div>
                <p className="esm-hint">
                  Реквизиты сохраняются в промежуточную таблицу и будут отправлены в ЕПВО при синхронизации.
                </p>
              </div>
            )}

            {activeTab === 'other' && (
              <div className="esm-tab-content">
                <div className="esm-grid">
                  <Field label="Адрес прописки" name="address" />
                  <Field label="Адрес проживания" name="livingAddress" />
                  <Field label="Город" name="city" />
                  <Field label="E-mail" name="mail" />
                  <Field label="Телефон" name="phone" />
                  <Field label="Мобильный" name="mobilePhone" />
                  <Field label="Номер УДЛ" name="icNumber" />
                  <Field label="Дата выдачи УДЛ" name="icDate" type="date" />
                  <Field label="Серия УДЛ" name="icSeries" />
                  <Field label="Тип УДЛ" name="icType" type="number" />
                  <Field label="Номер аттестата" name="nomerAttestata" />
                  <Field label="Серия аттестата" name="seriyaAttestata" />
                  <Field label="Дата выдачи аттестата" name="dataVydachiAttestata" type="date" />
                  <Field label="Серия диплома" name="seriyaDiploma" />
                  <Field label="Дата выдачи диплома" name="dataVydachiDiploma" type="date" />
                  <Field label="Место рождения" name="otherBirthPlace" />
                  <Field label="Название школы" name="schoolName" />
                  <Field label="Образование" name="education" />
                  <Field label="Номер приказа" name="startOrder" />
                  <Field label="Сертификат ЕНТ/КТ" name="certificate" />
                  <Field label="Номер гранта" name="grantNumber" />
                  <Field label="Статус обучающегося" name="isStudent" type="number" />
                  <Field label="Общежитие" name="dormState" type="number" />
                  <Field label="Академ. отпуск" name="isInRetire" type="select" options={[
                    { value: true, label: 'Да' },
                    { value: false, label: 'Нет' },
                  ]} />
                  <Field label="Местный" name="local" type="select" options={[
                    { value: true, label: 'Да' },
                    { value: false, label: 'Нет' },
                  ]} />
                  <Field label="Алтын белгі" name="altynBelgi" type="select" options={[
                    { value: true, label: 'Да' },
                    { value: false, label: 'Нет' },
                  ]} />
                  <Field label="КАТО рождения" name="birthPlaceCatoId" type="number" />
                  <Field label="КАТО проживания" name="livingPlaceCatoId" type="number" />
                  <Field label="КАТО прописки" name="registrationPlaceCatoId" type="number" />
                  <Field label="КАТО аттестата" name="naselennyiPunktAttestataCatoId" type="number" />
                  <Field label="Гражданство ID" name="sitizenshipId" type="number" />
                  <Field label="Страна прибытия ID" name="fromId" type="number" />
                  <Field label="Источник финансирования ID" name="fundingId" type="number" />
                  <Field label="Тип кода" name="typeCode" />
                </div>
              </div>
            )}
          </EditFormContext.Provider>

          <div className="esm-actions">
            <button type="button" className="esm-btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="esm-btn-primary">Сохранить в TEMP</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;
