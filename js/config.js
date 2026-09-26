/* ================================================================

   💖 EDIT THIS FILE 💖

   Everything personal lives here: her name, your notes, memories,
   wishes, shayari, the letter and the final secret.

   This version is written to sound more like YOU talking to her:
   a little stupid, a little flirty, a little emotional,
   and a lot more personal. ❤️

   Tip: text inside `backticks` can contain "double quotes" and line
   breaks safely. Text inside "double quotes" can't contain more
   "double quotes" (use 'single quotes' inside instead).

   ================================================================ */

window.BIRTHDAY = {

  // Her name (big title) and the nickname you actually use

  name: "Anshikaaaaaaaa",

  nickname: "Jaaaanuuuuuu",

  // Your name

  from: "Your love (Sourabh) ehehhehehehe",

  // Her new age: becomes the glittery NUMBER candles on the cake ("23" → a 2 and a 3)

  age: "23",

  // The day you got together

  togetherSince: "2025-09-11",

  // Background music for the whole site: "A Thousand Years" (violin cover)

  music: "assets/music/a-thousand-years.mp3",

  // 🎵 Plays only on the Memory Lane (photos) page: "Tum Se Hi"
  // The main song fades back in when she leaves that page.
  memoriesMusic: "assets/music/tum-se-hi.mp3",

  // 🎂 Birthday song on the cake page. Leave "" to use the built-in music-box
  // Happy Birthday with sing-along lyrics ("…happy birthday dear <name>").
  // Or put a sung version in assets/music/ (e.g. you singing it! 🎤) and set:
  //   cakeSong: "assets/music/happy-birthday.mp3",
  cakeSong: "",

  /* 🖼️ PHOTO GALLERY ------------------------------------------------------
     These photos float around the balloon world, appear inside every
     love note, and flip through the frames on the Memory Lane page.

     ✅ Right now: 68 photos in assets/photos/gallery/ named 1.jpg … 68.jpg,
        sorted by date (Sept 2025 → Sept 2026, her drawings at the end).
     👉 To add more: save them as 69.jpg, 70.jpg … in the same folder and
        change GALLERY_COUNT below to the new total.
     (Your full-size originals are in the Birthday-original-photos folder,
      next to this project, so they don't make the website heavy.) */
  gallery: Array.from({ length: 68 /* GALLERY_COUNT */ }, (_, i) => `assets/photos/gallery/${i + 1}.jpg`),

  // Sweet lines shown on the back of gallery photos when she flips them
  photoLines: [
    "Look at you. How are you this beautiful? 😍",
    "My favourite view in the whole world.",
    "This smile is my weakness. 💗",
    "Still can't believe you're mine.",
    "Every photo of you is my new favourite.",
    "10/10, no notes. Perfect human. ✨",
    "I'd relive this moment a thousand times.",
    "You + me = my happiest place. 🫶",
  ],

  // Intro screen

  introLine:
    `Okayyy birthday girl, it's finally your dayyy ❤️ haa kisi ko bhi apna bday aacha nahi lagtaa ek saal or kmm ho gya jindigi se...yaad h wo doremon wali line new year wale episode m bolta h khidki  "Ek saal aur kam ho gaya meri zindagi ka... aur kuch badla nahi..whi badal whi dost"....haa esa hi feel hota h n isiliye passand nahi aata n khud ko khud ka bday i can feel you jaanuuu kaisa lagta h....but jaanuuu dekhooo you have achivedd soo muchh n...when you see last one yearr too muchh you have come forward ......and I could have just said Happy Birthday jaanuuuu and sent you a cute message... but obviously mai tumharaaboyfriendd itnee m thodii manugaa ehhehehehe. 😂 So I made this little corner of the internet just for you....go through it slowly and slowlyyy 🤭 ehehheehe 🐷❤️`,

  // 🎈 One note hides inside each balloon

  balloonNotes: [

    "I don't say it enough, but you really do mean a LOT to me jaanuuuu sachhiii babyyyyy...and haan, sometimes i see our photos espically yoursss anddd i smile like an idiot kii yaarr ittiii sundarr ittii achii merii girlfriendd ehheehehe. 🥺❤️",

    "You know what's actually unfair? You're cute even when you're angry with me...Matlab  wo toh pta hota h mai nahi jitne wala tumse frr bhi ladta hu ...ehehhehe teasee karene m bada maza aata h.... 😭😂",

    "I notice your effortss  jaanuuuu. The little things you do, the things you remember, the times you try to make me happy when i say something ki im feeling this or than at every moment you leave your problems for me... I may not say it every single time, but I genuinely notice them jaanuuuuu 🫶",

    "Kabhi kabhi lafz kam pad jaate hain,\nKuch log bas dil mein utar jaate hain... ❤️",

    "Tumhe dekh ke ek problem hoti hai... thoda aur dekhne ka mann karta hai. Phir thoda aur. Phir samajh aata hai ki madam, abb jane ka wakt ho gyaa...ye samayy sabsee badii dushmann hh😂❤️",

    "Your random messagess...jaanuuuu jaanuuu krr k aana merepasss, random calls haa ikk manyy things are not good between us like.....wo sunna ki pta h aaj kya huaa...i miss themm wha nahi jaungaa..thats my mistakee, itti sarii reels bhejnaa cutee cutee siii , random 'kuchuu puchuuu' andd haa mai sahrmaa jata huu itnaa sbb sunn k ...orr jo tumne naam rakhaa h Gullu..usse bhi sharmaa jata hu... somehow all of them became a very important part of my day....🥹",

    "Tumne mujhe sirf pyaar nahi diya,...tumne mujhe wo feel bhi karaya ki koi genuinely mere liye care karta hai mere liyee haii.... Aur ye feeling mere liye bohot special hai ❤️",

    "Kabhi tum mere liye kuch laati ho ehehehhe remotee controll carr hoo yaa mere liye face maskk hoo...any may FAV Green shirtt tooo and manyy more, kabhi kuch order karti ho, kabhi bas wait karti ho mujhe surprise karne ke liye... ye sab chhoti chhoti cheezein nahi hain, madam sahiba. I remember all of  them. 🥺",

    "Aur haan... tumne khud bola tha na ki mera Spiderman mil gaya hai? Toh ab complain mat karna, birthday pe bhi wahi Spiderman tumhari nautanki jhel raha hai...orr n kahi nahi gyaa h tumahra spiderman whii spiderman tumahre pas tha or rahegaa...samjhee nautankiii 🕷️🐷❤️",

    "Okay enough feelings. 😂 Ab last balloon ke baad actual surprise ki taraf jaana... orr thodaa paitencee rakhnaa...tod fod p mtt utarr aanaa..samjhee cutieeee 👀🎀",

  ],

  // 📸 Memory lane (the big spinning carousel in the middle).
  // Each memory points at a photo from the gallery folder. To use a different
  // photo, just change the number (e.g. gallery/3.jpg → gallery/15.jpg).

  memories: [

    {
      photo: "assets/photos/gallery/1.jpg", // fairy lights, Sept 2025
      emoji: "🕷️",
      title: "The beginning of us",
      date: "11 September 2025",
      caption:
        "Somewhere around this time, I didn't just get a girlfriend... I got my favourite person, my jaanuuu, and somehow became your Spiderman.....yourr everythingg joo tum kehtii hooo....mujhee sunn k bada aacha lagtaa h...ki you choose mee...tohh❤️"
    },

    {
      photo: "assets/photos/gallery/10.jpg", // the hug selfie
      emoji: "🥹",
      title: "That feeling",
      date: "One of our little moments",
      caption:
        "There are some memories where nothing extraordinary happened... but somehow I still remember exactly how happy I felt...to hug youu andd to roam you likee thisss..."
    },

    {
      photo: "assets/photos/gallery/19.jpg", // the two of you, red top
      emoji: "🌅",
      title: "Just us",
      date: "A favourite moment",
      caption:
        "The picture is nice, but the real memory is how it felt being there with you... That's the part I want to keep."
    },

    {
      photo: "assets/photos/gallery/3.jpg", // the Burger King crown 👑
      emoji: "🍕",
      title: "Our random plans",
      date: "Food + bKing",
      caption:
        "Half our conversations start normally and somehow end somewhere completely random..."
    },

    {
      photo: "assets/photos/gallery/33.jpg", // boat ride in the pink raincoat
      emoji: "✈️",
      title: "Our adventures",
      date: "More to come",
      caption:
        "The best part isn't even where we go...together...It's having someone beside me with whom even a random plan becomes a memory...kabhi kabhi bina plan k bhi..."
    },

    {
      photo: "assets/photos/gallery/16.jpg", // cuddly silly selfie
      emoji: "🐷",
      title: "Us being us",
      date: "Too much nonsense",
      caption:
        "The teasing, the stupid jokes, the random talks frr tumko khana khane jana padta h, the 'jaanuuu' spam... this is the stuff that feels the most like us."
    },

    {
      photo: "assets/photos/gallery/14.jpg", // night hug
      emoji: "🫂",
      title: "The difficult days too",
      date: "Still us",
      caption:
        "We've had beautiful days and difficult ones too...I don't want to erase either. They both taught me to understand you better and value what we have..."
    },

    {
      photo: "assets/photos/gallery/44.jpg", // selfie together, Sept 2026
      emoji: "❤️",
      title: "Us, right now",
      date: "And still counting...",
      caption:
        "A year, a thousand conversations, too many jokes, some fights, a lot of love... and still so many memories left to make."
    },

  ],

  // 🫙 Reasons I love you
  // A lot of these are specifically about the effort YOU make for me.

  reasons: [

    "The way you call me 'jaanuuu'...eheheheheh too cuteeeee i feellll lovedddd soo muchh hearingg thissss",

    "The way you call me your Spiderman. I still secretly love that one....udd k aaungaa uthaa k lee jaungaa samjhee MJ🕷️❤️",

    "Your random 'I miss you' messages that arrive exactly when I need them...when i  alsoo missing youuu ",

    "The songs you start singling in middle of convo mere liyee bhi kabhi gaa diya karoo aacha lagtaa h sunne m",

    "The way you check whether I've eaten or not....",

    "The way you worry about me when I'm stressed or not feeling okay....",

    "The times you try to make me happy without making a big deal out of it....",

    "The things you've ordered for me just because you thought I'd like them....",

    "That time you were literally waiting to surprise me because you wanted to see my reaction.....🥹",

    "The little things you remember about me that I sometimes don't even realise you've noticed....",

    `The way you encourage me when I start doubting myself....."haa krr logee tum....yourrr aree strong....ho jaygaa jaanuuu"`,

    "When you told me to be proud of myself... even when I wasn't able to see what you were seeing....sachiiii",

    "The fact that you genuinely want to see me doing well in life....",

    "The way you listen to my endless career/coding nonsense even when you probably have zero interest in half of it....mai kuch bhi gyan de deta huu",

    "That necklace you still wear....You probably don't realise how much that means to me...eveytime i see i felt something something in my heartt",

    "The way you cared for that little plant and even brought flowers for it....I notice these things, madam sahiba. 🌱❤️",

    "Your stubbornness... which I will continue to complain about while secretly finding it cute....",

    "The way you can go from serious conversation to complete opposite in approximately three seconds...i be like what is thisss",

    "The fact that even after difficult days, you've still tried to understand, talk and make things better...between us",

    "And honestly... the biggest reason is simply that you're YOU. There isn't another Anshika....andd naa hogiii ❤️",

  ],

  // 🏮 Wishes for her future

  wishes: [

    "I hope this year makes you ridiculously happy. The proper wala happy... ❤️",

    "I hope you get the job, opportunities and life you've been working towards...jo bhi tumko chaiyeee andd i knowww youu'll crack it maii huu tumahre sath...yaha tkk pohvhee ho aage bhi ho jayga",

    "Ghumte rehnaa pahad ho ya beach...pahad p chadd k samjh aaya i'm to beach personn...😂⛰️",

    "I hope you get more freedom to explore the world and do the things you've always wanted to do....",

    "I hope you become more confident in yourself and stop underestimating how capable you are....wo toh tumko pta hi h ...ikk bol dege yaha p",

    "I hope your days have more laughter, good food with healthyy onee...chalegaa maggiee ehehhehe, peaceful nights and fewer unnecessary overthinking sessions....yoss babyyyy ",

    "I hope whenever something good happens in your life, you have someone beside you screaming 'I TOLD YOU SO'. And yes, I have already applied for that position. 😌❤️",

    "I hope you always have people around you who make you feel safe, respected and loved.",

    "I hope one day we look back at all these little conversations and laugh at how seriously we took some of our stupid arguments. 🐷",

    "And selfishly... I hope I get to be there for many more birthdays, trips, random calls, hugs and stupid little moments with you....❤️",

  ],

  // 🌸 A few shayaris (shown on the final screen: "🌸 Shayari for you" button)

  shayari: [

    "Teri ek smile ka asar kuch aisa hai,\nMera mood kharab ho toh bhi sab accha lagne lagta hai. ❤️",

    "Kuch log milte hain aur yaad ban jaate hain,\nTum mili toh lagta hai meri aadat ban gayi ho. 🫶",

    "Chaand ko dekhne wale bohot honge,\nMujhe toh meri jaanuuu hi har baar sabse khoobsurat lagii hh. 🌙❤️",

    "Tum paas raho ya door,\nDil ko farak hi nahi padta...\nKyunki tumhara naam aate hi,\nDil khud tumhare paas chala jaata hai. ❤️",

    "Aur ek chhoti si baat kehni hai,\nTum meri ho ya nahi usse zyada,\nMere dil mein tumhari jagah kya hai,\nBas itna hi kaafi hai. ❤️",

  ],

  // 💌 The love letter

  letter: [

    "Hey birthday girl,",

    "Happy Birthdayyy jaanuuu..i'm too happyyy forr youuuu❤️..bdayy ki bohtt bohttt badhiyii ho aapkoo cutieeeee...",

    "toh startt kartee h...pyarr see toh i loveeee youuu jaanuuuuu andd i lovee myy babyyy gurlll soooo soooo muchhh ...mere dil se dekhoge toh pta chalge how selfeshlyyi  lovee youu andd...reason i lovee youuu is not the things you doo for mee..ptaa nahi yaarr koi reason nahi h..pyarr karnee ka mere pass bss kartaa hu tumsee pyarr itte sare chijee h frr bhi lagta h wo tumahre same kuch nahi h...tumse hi toh pyarr aataa h jaanuuuu ❤️",

    "Pichhla ek saal sochta hu toh ajeeb sa lagta hai....likee itni jaldii 1 saal ho gyaa..mujhe abhi bhi yaad m last year mai website bana rha rha tha...esa lagta h wo abhi hi gya h wo din...tumhare message padhaa tha..like yaarr how itni jalidii nikl gyaaa...itne saare baatee kii humnee, 'jaanuuu' messages, boht sarii ladaiii...bohtt sariii ehehehhe frr bhi sathh h...that's onlyy matterss, plans... pata hi nahi chala kab tum meri everyday life ka itna bada part ban gayi...hamraa tripss ittee saree karee...orr bhi karengee thikk h nnn...mai leke chalungaa kahi plan banynge or chalnegee",

    "Aur Anshika, ek cheez main genuinely tumhe batana chahta hu main tumhare efforts notice karta hu...jo bhi tum karti ho bina bolee mere liyee... Tum mere liye kuch laati ho, kuch order karti ho, kabhi surprise karne ke liye wait karti ho, meri choti choti chijee yaad rakhti ho, mujhe khane peene ka puchti ho, jab mai low hota hu toh mujhe push karti ho... ye sab mere liye 'small things' nahi hain....",

    "Tumne ek baar mujhe bola tha ki tumhe mera Spiderman mil gaya. Aur ek aur time bola tha ki tumhe mere efforts aur meri shayari itni achhi lagti hai ki tum ro dogi. orrr n, mujhe us waqt bohot accha laga tha. Kyunki mere liye bhi love ka matlab sirf bade bade words nahi hai. Kabhi kabhi wo ek call, ek 'khana khaya?' ya ek chhota sa surprise hi bohot hota hai....eheehehee",

    "Aur mujhe tumhari woh quality bohot pasand hai ki tum sirf bolti nahi ho, tum care ko action mein dikha bhi deti ho...Wo necklace jo tum abhi bhi pehenti ho, wo plant jiske liye tum flowers leke aati ho..sikh rhi ho karnaa... wo surprise jiske liye tum wait kar rahi thi... ye sab cheezein mere dimaag mein reh jaati hain...likee itnaa affection itnaa caree...kabhi kabhi mera ronaa aajtaa h itii aachii ladkii itni aachii girlfriendd aachii toh h hi ittii khubsuratt kya batayee..itni khubsuratt aadayee...mai toh tumahri photo dekhh k khush hota rehta huuu...ehehehee❤️",

    "Tumahra mujhe motivate karnaa jab main khud ke kaam ko leke doubt karta hu, tumhara 'be proud of yourself' wala attitude genuinely mujhe accha feel karata hai. Shayad tumhe normal lagta hai, but mere liye wo normal nahi hai...",

    "Aur haan... tum kabhi meri jaanu, kabhi meri madam sahiba, kabhi meri bindni, kabhi mujhe kidnap le janee walii... tumhare kitne versions hain...Aur somehow mujhe sab pasand hain. 🐷❤️",

    "Humne ek baar ek bbaat boli thi na ki kabhi kabhi train patri se utar jaati hai, phir dono milke usko theek karte hain aur wapas sawari pe nikal jaate hain. Mujhe wo thought bohot pasand hai. Perfect rehna zaroori nahi hota... important ye hota hai ki dono ko parwah ho aur dono try karein....andd i knoww yourr pure heart you tryy..andd mee tooo jaanuuuu",

    `mai tumse kehna chatah hu ki, tum hasti raho hal pall,
mai rab se yahi fariyad karta hu, aapke hrr julm k baad bhi,
jaan aapeee hi marte hai, ye chand ye taareee,
mujhe nahi bhaateeee , hum toh hrr pall aapke chere ka didar karte h `,

    "andd jaanuuuu you'll achivee everyythingg you have dremtt off yaa it will be little hardd but i wishh you veryy bestt for yourrr futuree andd i knoww you'll rockk it myy babyy gurlll...you''ll achive everything you have dreamt off ...bestt off luckk babyyy❤️",

    "Teri ek muskurahat ke naam,\nMeri hazaaron khushiyan hain,\nTu bas yunhi hasta rehna,\nMeri jaan, meri saari duniya hai. ❤️",

    "So today and going forward, please don't overthink anything....kuch ho toh sochnaa i'm for you...(baat karte h, jo tumahre dil m h boht kuch uske bare m..chije thik karte h okaii bacchaa)...Bas enjoyyyy karo. Achha sa dress pehnooo (mai shippping karwaungaaa), achhi aachii photosss lo, aachaa aachaa khana khao, bohot saara cake khao, aur birthday girl banke full nakhre karo...ehehehe ",

    "Happy Birthday, Anshika myy babyyy gurll ❤️",

    "Thank you for being you.... Thank you for loving me, annoying me, supporting me, laughing with me and making so many normal days feel special.",

    "I love you, jaanuuu. Bohot saara. ❤️",

    "- Aapkaa Gulluu",

  ],

  // 🤫 The final secret

  secretMessage:
    "Okayyy madam sahiba...padhne wala bhi tera didar karega, ek baar nahi 100-100 baar padhega, mai likhunga jbb shayari tumm p, meri dairy ka ek ek paana bhi tumse pyar karega❤️",

  // Found by tapping the tiny star

  hiddenNote:
    "Psst... mil gaya secret. 😂 Mujhe pata tha tum ye chhota sa star nahi chhodogi. Itni curious jo ho. Eheheeheheh...agar ye mila toh mujhe reply dena mil gya kuchuuu puchuuu. ❤️",

};
