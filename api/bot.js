module.exports = async (req, res) => {
    const token = process.env.BOT_TOKEN;

    // Log request for debugging (visible in Vercel Logs)
    console.log('Bot request body:', JSON.stringify(req.body));

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
                const text = "✨ Добро пожаловать в ваше Личное Пространство.\n\nЯ помогу вам расшифровать коды вашей даты рождения и создать территорию для глубокого анализа вашей личности. Без лишних глаз, только вы и ваша Матрица.\n\nГотовы начать? Нажмите «Личное пространство ✨🔮» ниже. 👇";

                const response = await fetch(`${baseUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        reply_markup: {
                            inline_keyboard: [[
                                {
                                    text: "Личное пространство ✨🔮",
                                    web_app: { url: "https://tma.viktoriibarybina.com/" }
                                }
                            ]]
                        }
                    })
                });

                const result = await response.json();
                console.log('Telegram API response:', JSON.stringify(result));
            }

            return res.status(200).send('OK');
        } catch (error) {
            console.error('Bot Error:', error);
            return res.status(500).send('Internal Error');
        }
    } else {
        return res.status(200).send(`Bot is running. Token status: ${token ? 'Loaded' : 'Missing'}`);
    }
};
