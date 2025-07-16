import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
      setError('ID пользователя не указан');
      setLoading(false);
      return;
    }

    fetch(`https://regime-guardian-bot.onrender.com/api/stats/${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        return response.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!stats) return <div className="error">Нет данных</div>;

  const overGoal = stats.today.screen_time_actual > stats.today.screen_time_goal;

  const screenTimeData = {
    labels: ['Факт', 'Цель'],
    datasets: [
      {
        label: ' ',
        data: [stats.today.screen_time_actual, stats.today.screen_time_goal],
        backgroundColor: [
          overGoal ? 'rgba(255, 59, 95, 0.9)' : '#FF3B5F',
          '#4D4DFF'
        ],
        borderRadius: 8,
        barThickness: 80,
        borderColor: [
          overGoal ? '#FF3B5F' : '#FF3B5F',
          '#4D4DFF'
        ],
        borderWidth: [
          overGoal ? 4 : 2,
          2
        ]
      },
    ],
  };

  const screenTimeOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Экранное время',
        font: { family: 'Rajdhani', size: 26, weight: '700' },
        color: '#4D4DFF',
        padding: { top: 20, bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(25, 26, 35, 0.9)',
        titleFont: { family: 'Rajdhani', size: 20, weight: '700' },
        bodyFont: { family: 'Rajdhani', size: 18 },
        borderColor: '#8C52FF',
        borderWidth: 2,
        cornerRadius: 10,
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: { color: '#E0E0E0', font: { family: 'Rajdhani', size: 18 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#E0E0E0', font: { family: 'Rajdhani', size: 16 } },
        grid: { color: 'rgba(77, 77, 255, 0.2)' },
        title: { display: false }
      },
    },
  };

  const MinuteScale = ({ maxValue }) => {
  const step = 60;
  const markers = [];
  const totalTicks = Math.ceil(maxValue / step);
  const scale = maxValue > 0 ? 550 / maxValue : 1;
  for (let i = 0; i <= totalTicks; i++) {
    const left = i * step * scale;
    markers.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: i === 0 ? '0px' : `${left}px`, // Для 0 мин убираем смещение
          transform: i === 0 ? 'translateX(0)' : 'translateX(-50%)', // Убираем смещение для 0
          color: '#777',
          fontSize: '12px',
          textAlign: i === 0 ? 'left' : 'center', // Выравнивание слева для 0
          paddingLeft: i === 0 ? '4px' : '0', // Отступ для читаемости
        }}
      >
        {i * step} мин
        <div style={{ width: '2px', height: '8px', backgroundColor: '#777', margin: '2px auto 0' }} />
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'relative',
        height: '24px',
        marginBottom: '10px',
        width: `${maxValue * scale}px`,
        overflow: 'visible', // Убираем обрезку
      }}
    >
      {markers}
    </div>
  );
};

  const ActivityLine = ({ value, color, isLast, maxValue, accumulated, isProductive }) => {
    const clampedValue = Math.min(value, maxValue - Math.max(0, accumulated));
    const scale = maxValue > 0 ? 550 / maxValue : 1;
    const width = clampedValue * scale;
    const isExceeding = isLast && accumulated + value > maxValue;
    return (
      <div
        style={{
          backgroundColor: color,
          height: '12px',
          width: `${width}px`,
          borderRadius: '4px',
          transition: 'width 0.6s ease',
          display: 'inline-block',
          boxShadow: isExceeding && !isProductive ? '0 0 10px 2px #FF3B5F, 0 0 20px 4px rgba(255, 59, 95, 0.5)' : 'none',
          animation: isExceeding && !isProductive ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
    );
  };

  const ActivityLegend = ({ label, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <div style={{ width: '16px', height: '16px', backgroundColor: color, borderRadius: '3px' }}></div>
      <span style={{ color: '#E0E0E0', fontFamily: 'Rajdhani', fontSize: '16px' }}>{label}</span>
    </div>
  );

  const colors = [
    '#00FF9B', '#4D4DFF', '#FF3B5F', '#8C52FF', '#FFD700', '#1ABC9C', '#9B59B6', '#FF7F50', '#3498DB', '#F39C12'
  ];

  const screenActivityLabels = Object.keys(stats.today.screen_time_breakdown);
  const screenActivityValues = Object.values(stats.today.screen_time_breakdown);
  const maxScreenGoal = stats.today.screen_time_goal;
  const totalScreenTime = screenActivityValues.reduce((sum, v) => sum + v, 0);
  let accumulatedScreenTime = 0;

  const productiveActivityLabels = Object.keys(stats.today.productive_time_breakdown);
  const productiveActivityValues = Object.values(stats.today.productive_time_breakdown);
  const maxProductiveGoal = stats.today.screen_time_goal; // Используем тот же лимит для простоты
  const totalProductiveTime = productiveActivityValues.reduce((sum, v) => sum + v, 0);
  let accumulatedProductiveTime = 0;

  const activities = [
    { key: 'workout', label: 'Тренировка' },
    { key: 'english', label: 'Английский' },
    { key: 'coding', label: 'Программирование' },
    { key: 'planning', label: 'Планирование' },
    { key: 'stretching', label: 'Растяжка' },
    { key: 'reflection', label: 'Рефлексия' },
  ];

  const todayDate = new Date().toISOString().split('T')[0];
  const dateOptions = stats.today.morning_poll_completed || stats.today.is_rest_day
    ? [{ date: todayDate, ...stats.today }, ...stats.history]
    : stats.history;

  // Получаем данные для выбранной даты
  const historyData = dateOptions.find(day => day.date === selectedDate);

  return (
    <div className="App">
      <div className="header">
        <h1>📊 Отчёт командира</h1>
      </div>

      {!stats.today.is_rest_day && (
        <>
          <div className="card">
            <Bar data={screenTimeData} options={screenTimeOptions} />
          </div>

          {screenActivityLabels.length > 0 && (
            <div className="card">
              <h2 style={{ color: '#00FF9B', fontFamily: 'Rajdhani', fontSize: '26px', marginBottom: '20px', textAlign: 'center' }}>
                Не особо полезные активности
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <MinuteScale maxValue={maxScreenGoal} />
                <div style={{ position: 'relative', paddingBottom: '10px', marginBottom: '10px', display: 'flex', width: `${maxScreenGoal * (maxScreenGoal > 0 ? 550 / maxScreenGoal : 1)}px` }}>
                  {screenActivityLabels.map((label, i) => {
                    const value = stats.today.screen_time_breakdown[label];
                    const component = (
                      <ActivityLine
                        key={label}
                        value={value}
                        color={colors[i % colors.length]}
                        isLast={i === screenActivityLabels.length - 1}
                        maxValue={maxScreenGoal}
                        accumulated={accumulatedScreenTime}
                        isProductive={false}
                      />
                    );
                    accumulatedScreenTime += value;
                    return component;
                  })}
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                {screenActivityLabels.map((label, i) => (
                  <ActivityLegend key={label} label={label} color={colors[i % colors.length]} />
                ))}
              </div>
            </div>
          )}

          {productiveActivityLabels.length > 0 && (
            <div className="card">
              <h2 style={{ color: '#00FF9B', fontFamily: 'Rajdhani', fontSize: '26px', marginBottom: '20px', textAlign: 'center' }}>
                Полезные активности
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <MinuteScale maxValue={maxProductiveGoal} />
                <div style={{ position: 'relative', paddingBottom: '10px', marginBottom: '10px', display: 'flex', width: `${maxProductiveGoal * (maxProductiveGoal > 0 ? 550 / maxProductiveGoal : 1)}px` }}>
                  {productiveActivityLabels.map((label, i) => {
                    const value = stats.today.productive_time_breakdown[label];
                    const component = (
                      <ActivityLine
                        key={label}
                        value={value}
                        color={colors[i % colors.length]}
                        isLast={i === productiveActivityLabels.length - 1}
                        maxValue={maxProductiveGoal}
                        accumulated={accumulatedProductiveTime}
                        isProductive={true}
                      />
                    );
                    accumulatedProductiveTime += value;
                    return component;
                  })}
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                {productiveActivityLabels.map((label, i) => (
                  <ActivityLegend key={label} label={label} color={colors[i % colors.length]} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {stats.today.morning_poll_completed && !stats.today.is_rest_day ? (
        <div className="checklist-container">
          <h2>Чеклист активностей на сегодня</h2>
          <p>
            Экранное время: ~{Math.round(stats.today.screen_time_actual / 60 * 10) / 10}ч / {stats.today.screen_time_goal / 60}ч
          </p>
          <p>
            Полезное время: ~{Math.round(stats.today.productive_time_actual / 60 * 10) / 10}ч
          </p>
          <ul>
            {activities.map(activity => (
              stats.today[`${activity.key}_planned`] ? (
                <li key={activity.key} className={stats.today[`${activity.key}_done`] ? 'done' : ''}>
                  {activity.label}: {stats.today[`${activity.key}_done`] ? '✅ Выполнено!' : '❌ Не выполнено'}
                </li>
              ) : null
            ))}
          </ul>
        </div>
      ) : stats.today.is_rest_day ? (
        <div className="card">
          <p>🏖️ Сегодня разгрузочный день. Данные отсутствуют.</p>
        </div>
      ) : (
        <div className="card">
          <p>Чеклист будет доступен после завершения утреннего опроса (/morning).</p>
        </div>
      )}

      {dateOptions.length > 0 ? (
        <div className="history-checklist-container">
          <h2>Чеклист за прошлые дни</h2>
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-selector"
          >
            <option value="">Выберите день</option>
            {dateOptions.map(day => (
              <option key={day.date} value={day.date}>
                {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                {day.is_rest_day ? ' (Отдых)' : ''}
              </option>
            ))}
          </select>
          {selectedDate && historyData ? (
            historyData.is_rest_day ? (
              <div className="card">
                <p>🏖️ Это разгрузочный день. Данные отсутствуют.</p>
              </div>
            ) : (
              <div>
                <p>
                  Экранное время: ~{Math.round(historyData.screen_time_actual / 60 * 10) / 10}ч / {historyData.screen_time_goal / 60}ч
                </p>
                <p>
                  Полезное время: ~{Math.round(historyData.productive_time_actual / 60 * 10) / 10}ч
                </p>
                <ul>
                  {activities.map(activity => (
                    historyData[`${activity.key}_planned`] ? (
                      <li key={activity.key} className={historyData[`${activity.key}_done`] ? 'done' : ''}>
                        {activity.label}: {historyData[`${activity.key}_done`] ? '✅ Выполнено!' : '❌ Не выполнено'}
                      </li>
                    ) : null
                  ))}
                </ul>
              </div>
            )
          ) : (
            <p>Выберите день для просмотра чеклиста.</p>
          )}
        </div>
      ) : (
        <div className="card">
          <p>Нет данных для отображения чеклиста. Выполните /morning.</p>
        </div>
      )}
    </div>
  );
}

export default App;