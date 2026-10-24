module.exports = async (req, res) => {
    const token = process.env.BOT_TOKEN;

    const welcomeVersion = '20261024.2';

    if (!token) {
        console.error('BOT_TOKEN is not defined in environment variables');
        return res.status(500).send('Config Error');
    }

    const baseUrl = `https://api.telegram.org/bot${token}`;

    if (req.method === 'POST') {
        try {
            const { message } = req.body;

            if (message && message.text === '/start') {
                const chatId = message.chat.id;
                const text = '<b>Мой личный Нумеролог</b>\nЛичное пространство от Виктории Барыбиной ✨\n\nВаша матрица, прогнозы и персональные разборы — в одном месте.\n\nНачните с <b>основной матрицы</b>: откройте приложение и введите дату рождения.\n\nВаши сохранённые расчёты и приобретённые продукты будут доступны здесь при следующих входах.';

                const response = await fetch(`${baseUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [[
                                {
                                    text: "Открыть личное пространство →",
                                    web_app: { url: "https://tma.viktoriibarybina.com/" }
                                }
                            ]]
                        }
                    })
                });

                const result = await response.json();
                if (!response.ok || !result.ok) {
                    console.error('Telegram welcome delivery failed:', result.error_code);
                    return res.status(502).send('Delivery Error');
                }
            }

            return res.status(200).send('OK');
        } catch (error) {
            console.error('Bot Error:', error);
            return res.status(500).send('Internal Error');
        }
    } else {
        return res.status(200).send(`Bot is running. Welcome version: ${welcomeVersion}`);
    }
};
