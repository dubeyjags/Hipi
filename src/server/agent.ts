import 'dotenv/config';
import { corsair } from "./corsair";

const main = async () => {
    // const res = await corsair.withTenant('dev').googlecalendar.api.events.create({

    // });
    // const res = await corsair.withTenant('dev').gmail.api.threads.list({ maxResults: 50 });
    const res = await corsair.withTenant('dev').gmail.db.threads.list({});
    // const res = await corsair.withTenant('dev').gmail.db.threads.search({ 
    //     data:{
    //         snippet: {
    //             contains: 'Job invite'
    //         }
    //     }
    // });    https://nature-exorcism-palatable.ngrok-free.dev/api/webhooks
    console.log(res);
}
main().catch(console.error);
