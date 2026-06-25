import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { C } from './theme';

// Inject Forte HR styles to override react-datepicker defaults
const PICKER_STYLES = `
  .react-datepicker {
    font-family: Inter, sans-serif;
    border: 1.5px solid #E4E3DC;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    overflow: hidden;
  }
  .react-datepicker__header {
    background: #FAFAF7;
    border-bottom: 1px solid #E4E3DC;
    padding: 12px 0 8px;
  }
  .react-datepicker__current-month {
    font-size: 14px;
    font-weight: 600;
    color: #15161A;
    margin-bottom: 6px;
  }
  .react-datepicker__day-name {
    font-size: 11px;
    font-weight: 600;
    color: rgba(21,22,26,0.4);
    text-transform: uppercase;
    width: 36px;
    line-height: 36px;
  }
  .react-datepicker__day {
    width: 36px;
    line-height: 36px;
    border-radius: 8px;
    font-size: 13px;
    color: #15161A;
    margin: 1px;
  }
  .react-datepicker__day:hover {
    background: rgba(200,32,61,0.08);
    color: #C8203D;
    border-radius: 8px;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--range-start,
  .react-datepicker__day--range-end {
    background: #C8203D !important;
    color: #fff !important;
    border-radius: 8px !important;
    font-weight: 600;
  }
  .react-datepicker__day--in-range {
    background: rgba(200,32,61,0.10);
    color: #C8203D;
    border-radius: 0;
  }
  .react-datepicker__day--range-start {
    border-radius: 8px 0 0 8px !important;
  }
  .react-datepicker__day--range-end {
    border-radius: 0 8px 8px 0 !important;
  }
  .react-datepicker__day--range-start.react-datepicker__day--range-end {
    border-radius: 8px !important;
  }
  .react-datepicker__day--keyboard-selected {
    background: rgba(200,32,61,0.08);
    color: #C8203D;
  }
  .react-datepicker__day--disabled {
    color: rgba(21,22,26,0.2) !important;
    cursor: not-allowed;
    text-decoration: line-through;
  }
  .react-datepicker__day--disabled:hover {
    background: transparent !important;
    color: rgba(21,22,26,0.2) !important;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #C8203D;
  }
  .react-datepicker__navigation:hover *::before {
    border-color: #15161A;
  }
  .react-datepicker__today-button {
    background: #FAFAF7;
    border-top: 1px solid #E4E3DC;
    font-size: 13px;
    font-weight: 600;
    color: #C8203D;
    padding: 8px;
  }
  .react-datepicker__input-container input {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid #E4E3DC;
    border-radius: 8px;
    font-size: 14px;
    font-family: Inter, sans-serif;
    color: #15161A;
    background: #FAFAF7;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .react-datepicker__input-container input:focus {
    border-color: #C8203D;
    box-shadow: 0 0 0 3px rgba(200,32,61,0.08);
    background: #FFFFFF;
  }
  .react-datepicker-popper {
    z-index: 9999;
  }
  .react-datepicker__day--outside-month {
    color: rgba(21,22,26,0.2);
  }
  .react-datepicker__day--weekend {
    color: rgba(21,22,26,0.3);
  }
  .react-datepicker__day--today {
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

// Helper: convert yyyy-mm-dd string to Date at local midnight
const toDate = (str) => str ? new Date(`${str}T00:00:00`) : null;

// Helper: convert Date to yyyy-mm-dd string
const toISO = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper: check if a date is a weekend
const isWeekendDate = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// SingleDatePicker — for join date, task deadline, single date inputs
// Props:
//   value: yyyy-mm-dd string
//   onChange: (yyyy-mm-dd string) => void
//   placeholder: string
//   minDate: yyyy-mm-dd string (optional)
//   maxDate: yyyy-mm-dd string (optional)
//   disabled: boolean (optional)
export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  disableWeekends = false,
}) {
  return (
    <>
      <style>{PICKER_STYLES}</style>
      <ReactDatePicker
        selected={toDate(value)}
        onChange={(date) => onChange(toISO(date))}
        placeholderText={placeholder}
        dateFormat="dd/MM/yyyy"
        minDate={minDate ? toDate(minDate) : undefined}
        maxDate={maxDate ? toDate(maxDate) : undefined}
        disabled={disabled}
        filterDate={disableWeekends ? (date) => !isWeekendDate(date) : undefined}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        todayButton="Today"
      />
    </>
  );
}

// WorkdayRangePicker — for leave requests and leave plans
// Disables weekends. Shows range highlight between start and end.
// Props:
//   startDate: yyyy-mm-dd string
//   endDate: yyyy-mm-dd string
//   onStartChange: (yyyy-mm-dd string) => void
//   onEndChange: (yyyy-mm-dd string) => void
//   minDate: yyyy-mm-dd string (optional)
export function WorkdayRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
}) {
  const start = toDate(startDate);
  const end = toDate(endDate);

  return (
    <>
      <style>{PICKER_STYLES}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <ReactDatePicker
            selected={start}
            onChange={(date) => {
              const iso = toISO(date);
              onStartChange(iso);
              // Clear end date if it is before new start
              if (end && date && end < date) onEndChange('');
            }}
            selectsStart
            startDate={start}
            endDate={end}
            filterDate={(date) => !isWeekendDate(date)}
            placeholderText="Start date"
            dateFormat="dd/MM/yyyy"
            minDate={minDate ? toDate(minDate) : undefined}
            todayButton="Today"
          />
        </div>
        <div>
          <ReactDatePicker
            selected={end}
            onChange={(date) => onEndChange(toISO(date))}
            selectsEnd
            startDate={start}
            endDate={end}
            minDate={start || (minDate ? toDate(minDate) : undefined)}
            filterDate={(date) => !isWeekendDate(date)}
            placeholderText="End date"
            dateFormat="dd/MM/yyyy"
            todayButton="Today"
          />
        </div>
      </div>
    </>
  );
}

// RangeDatePicker — for KPI start/end (no weekend restriction)
// Props:
//   startDate: yyyy-mm-dd string
//   endDate: yyyy-mm-dd string
//   onStartChange: (yyyy-mm-dd string) => void
//   onEndChange: (yyyy-mm-dd string) => void
//   minDate: yyyy-mm-dd string (optional)
export function RangeDatePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
}) {
  const start = toDate(startDate);
  const end = toDate(endDate);

  return (
    <>
      <style>{PICKER_STYLES}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <ReactDatePicker
            selected={start}
            onChange={(date) => {
              const iso = toISO(date);
              onStartChange(iso);
              if (end && date && end < date) onEndChange('');
            }}
            selectsStart
            startDate={start}
            endDate={end}
            placeholderText="Start date"
            dateFormat="dd/MM/yyyy"
            minDate={minDate ? toDate(minDate) : undefined}
            todayButton="Today"
          />
        </div>
        <div>
          <ReactDatePicker
            selected={end}
            onChange={(date) => onEndChange(toISO(date))}
            selectsEnd
            startDate={start}
            endDate={end}
            minDate={start || (minDate ? toDate(minDate) : undefined)}
            placeholderText="End date"
            dateFormat="dd/MM/yyyy"
            todayButton="Today"
          />
        </div>
      </div>
    </>
  );
}
