/**
 * Typing Utilities for TypeMaster
 */

// Mapping of common characters to practice words for adaptive drill generation
const CHAR_TO_WORDS = {
    'a': ['algorithm', 'async', 'await', 'access'],
    'b': ['buffer', 'binary', 'boolean', 'backend'],
    'c': ['cloud', 'compiler', 'constant', 'callback'],
    'd': ['data', 'debugger', 'deployment', 'database'],
    'e': ['effect', 'examine', 'execute', 'encryption'],
    'f': ['function', 'frontend', 'filesystem', 'fetch'],
    'g': ['global', 'gradient', 'gateway', 'grid'],
    'h': ['history', 'header', 'heatmap', 'handle'],
    'i': ['interface', 'identity', 'instance', 'integer'],
    'j': ['javascript', 'json', 'join', 'jump'],
    'k': ['keystroke', 'kernel', 'keyboard', 'kinetic'],
    'l': ['logic', 'leaderboard', 'latency', 'local'],
    'm': ['matrix', 'mutation', 'mapping', 'module'],
    'n': ['neural', 'network', 'node', 'numeric'],
    'o': ['operator', 'object', 'offline', 'optimization'],
    'p': ['protocol', 'parallel', 'pointer', 'pattern'],
    'q': ['query', 'queue', 'quality', 'quantize'],
    'r': ['react', 'resource', 'runtime', 'recursive'],
    's': ['sync', 'synthetic', 'storage', 'server'],
    't': ['temporal', 'transition', 'timestamp', 'token'],
    'u': ['utility', 'update', 'user', 'unique'],
    'v': ['vault', 'virtual', 'variable', 'version'],
    'w': ['websocket', 'window', 'worker', 'wrapper'],
    'x': ['xml', 'xor', 'execute', 'proxy'],
    'y': ['yield', 'yaml', 'yesterday', 'yellow'],
    'z': ['zoom', 'zinc', 'zone', 'zero'],
    ';': ['status;', 'data;', 'config;', 'link;'],
    '{': ['{data}', '{state}', '{node}', '{sync}'],
    '(': ['(id)', '(u)', '(event)', '(race)'],
    '.': ['this.data', 'user.uid', 'db.ref', 'auth.user']
};

export const ACADEMY_MODULES = [
    {
        id: "mod_0_home",
        title: "Home Row Keys (F, J, D, K)",
        description: "Practice foundational home-row finger placement. Press the indicated key with the highlighted finger.",
        keys: ["F", "J", "D", "K", "S", "L", "A", ";"],
        difficulty: "easy",
        minWPM: 15,
        minAccuracy: 95,
        maxErrors: 8,
        isTokenDrill: true,
        tokens: ["f", "j", "d", "k", "f", "j", "d", "k", "s", "l", "a", ";", "f", "j", "d", "k", "f", "f", "j", "j", "d", "d", "k", "k", "f", "d", "j", "k", "s", "a", "l", ";", "f", "j", "d", "k", "f", "j", "d", "k", "d", "k", "f", "j", "s", "l", "a", ";", "f", "d", "k", "j", "a", "s", "d", "f", "j", "k", "l", ";"],
        texts: ["f j j f j f j d k k d k d s l l s a ; a ; fd sa jk l;"]
    },
    {
        "id": "mod_1",
        "title": "Home Row Basics",
        "description": "Establish the core foundation.",
        "keys": ["A", "S", "D", "F", "J", "K", "L", ";"],
        "difficulty": "easy",
        "minWPM": 15,
        "minAccuracy": 90,
        "maxErrors": 15,
        "isTokenDrill": true,
        "texts": [
            "ads as fall fads lad fall ask fad as lass dads alfalfa lass as falls sass as lass lass alas fads alas salad dad ask flask as salad falls salad lads as lads all fall flask add lass flask fads lads add alas as lass dads lass salad dad flask fads dad lad fad salsa fall sass fad lass as fall salad as add as ask alfalfa lads all ask falls ask all ask ads alfalfa lads lad sass as ads as dads salad sass alas salad lass salad add",
            "lad fads dads dad salad fad dad lass flask ask add ads flask falls all fall lass lads add falls flask as lad fads flask ask ask fall ads lads add as fall ask as ask dads ask sass ask falls lads salad lad sass dads dads all fad lads as fads salsa salad add all salad alfalfa add lad ads alfalfa falls dad alfalfa lass dad all as salad flask fall lad all flask fad dads fad ads ask ask alas dad falls fads all ads dad falls fall",
            "fad ask as flask flask as sass ads lad alas alfalfa fall lads ask ads salad falls ask lads as fads fall dad fads ask fad flask fall ads add dad lad flask falls fall salsa lad flask fads as as dads lads dad ask dads sass flask flask sass flask dads lad ads falls salad add as all sass salad ask lad ask lad dads flask salad ask alas all fads fall lad fall sass add ads fad salsa sass as alfalfa dads falls fad lads ask ask sass",
            "lad alas lass flask as all fads falls lass add flask add alfalfa alas dad add fall dads ads as lass add as dad lads lads lass dads ads salad as sass dad dad salad lads flask dad dads salsa dads fad salad salad sass falls ads ask as ads all lad alas all lad dad salad dads lads dads flask ask ask salsa alfalfa as fad all alfalfa alas dad ask lass as salsa flask flask salsa alas add fall ask alfalfa as ask add lads sass flask alfalfa",
            "salsa fads add falls as lass dads fads fads dad lads lad salsa add lad flask alfalfa lads alfalfa ask dads flask flask flask fall falls dad as dads dad sass dads fad lass lad all salad dads flask lass alas flask add dad falls lad alas fad dads dad lad fads falls ads as add fall alas falls ads falls all flask falls ads salad sass fad fads salad fad flask alfalfa salad dad ads salsa alas alas sass falls flask as salsa dads add dad add ads alas"
        ]
    },
    {
        "id": "mod_2",
        "title": "Home Row Mastery",
        "description": "Conquer the center column.",
        "keys": ["G", "H"],
        "difficulty": "easy",
        "minWPM": 15,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "lass flash dash sass shall salsa flask fad slash glad glass sad ads sass flash slash flask hall all alfalfa glad add add all sass has lads flags hag slash flask flags ask all alfalfa shall ads alas gash all salsa dash ads lass hall lass hag gash ash hag lad lad ask hag shall flag hag dash ads fads fall ash gash lass lass flags sad all dash dads dash fad dad add alfalfa add glass gag shall hall haggah ask hag lass flag sad flask fall glad lass",
            "had alfalfa flask fad has slash gag flags fad dads ask alas ads lad dash shall gag lass dad all salad alas slash sass fad lads gag as flags hag hag haggah fads lass shall gall salsa had fad all sad has haggah flash fall flask flags salsa lass salsa all alfalfa fall alfalfa glad hall flash glass sad sad flash dads shall alas dash ask hall falls flags salsa ask dad flash salad alas dash salad dash all fall flash shall ads as gall ads salad as ash haggah",
            "has has fad flash lads had dads falls ash dads sass slash all ask lad dash dad fall all gash hall sad fall fad flash dad ask shall fads hall hag falls haggah hag dads dash hall all sass gall has flask glass shall ask dad ash glass hag has ask salsa lads had falls ask ads ads ask glass as lad lad lad had haggah haggah had fads dad glass lads hall falls fad flash hall alas salad lad hall hag dads all alfalfa add salad falls hag all",
            "salsa lass as alfalfa salad had slash alfalfa salsa has fads as gall alas sad dad hag all as shall gall has had all sass add lad gall fad fall flags dash had add haggah dad fads lads sass sad sass dash glass gash gag ask salsa gash sad hall dash dad had alfalfa lass had had sad shall fall sad flash flash flash fall has ask dad sad flags dads sass salad slash sad ads lads haggah falls lad haggah flash slash glad alfalfa has dad dash sad hag",
            "dash dads shall lad glass ask all flags lad as shall ask add salad hall slash all dad add alas sad haggah flag flags alfalfa lass salad lad lad flag sad flags salad flask all add alas fads flask fad lad gall hag hall hall alas dad glass lad gall falls gash hag ads fall glad gag add add has slash shall slash gall shall alfalfa as sass dads lass lad ask salsa lass shall gall gash alas flask as gash has ads lass fads flask slash lass lass flag"
        ]
    },
    {
        "id": "mod_3_test",
        "title": "Home Row Test",
        "description": "This is a pass/fail assessment. Reach the target velocity to unlock the next neural path.",
        "isTest": true,
        "keys": ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
        "difficulty": "hard",
        "minWPM": 20,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "l;dl g;g; kk ghgha ;fhd sfjfda gkgja hfag hhklha ff ldj sjad k;sd glhdaa g;ljs ag ghhafh ggf as;sf kshk ddh hgkj ;;; aaasga g;;;j fh;kjh skl ;j ga g;a;h hg;jhl gfgh fhka ga hhdsj gh; dhh a;sgd hakgs gssaff gdaalh lldfdl lkd ff kjkjgf al;sak hsgf gkdddd l;hdj ;sah ah shs lhasf h; lhfhkk slhas ad;k gl ff dafkja klkfas fld; dglfgh gh akhg fl al fj ;l;;g ;aa ;;dksl al assjl lhada; ;lkd sa;sg gjdak ;gk ;f hj ad fas af kj s;gf ;jjgdg djfl ffhk;s fgka; kg lgkkag llsj fsg ld ga flfss f;aajd skhfs sld; lgda; ljalja dh ;adskg sj lgh; aldfgk slad aak; aj ;sf;js kg shjlgs l;gj aj ;; kgsffs jas;l f; fhhf skha ;jlsd lga lfksfk s;fs fkg afdsgh sh jsk kgffa kjlfg ga fkkd kl s;hfg; s;fjk k;jhh g;ga sssdhs dsldhl jkall fflss; ls lflsks khgdgg k;hk ffgl sdhkg; ggk jf;dj ;fskj; kljjfh ggs hs lsjls sal aaakld jdld ;a gg lhdkdd",
            "dhga sjgf s;l ;;gag gdh gdg;a kaaksa ;kalsl ad shf;f ladf;a ajga d;dgjf kllss ljs shd hhsj aaasas ls khlaha hakfkj fahdlf lgdjsg khdkk lf ksaffa ksa ah;jk aa gjj gflsfd gg;a; hl kf djjdhf ;kk ;jffl sh fs daslh; ;a fj jsal skj d; fllkhl ggghs ;;df kad; ss sgkjgj gahal jgjfdj sf;s ssgdk fjf kfls sjjf jjkgl gah slg ff dg lld jggfs hhjhld fafadj ;dha adhg; hlffhs da al;s kff;h alajdh hdja hjk aja;hl dkh ;gfl dl fd;;ga dfsg ;jfakj ffj; sf gjaa sf;gk lk lk flkglj dagkk; lssk sg hs dsakls algjd ;ahsd ah gsdd glasds jj gs lg sksa;h asl;f g;hl jf ajahs ;f dfsf hd; fklslg d;jld hhj;j ghah;h hhh ;sj ;jghsa ghs kssh k; gllj jgh ld ;kglga jal ;hhgka lgsf sfa asd fkdla ff la; kd kgfdd; dlfa ;;akh kjjak ddhgh ;kdd; sa kgdd sddl sj;l gkhkad dsa s;h ;l;j ashad ;a dkksa gk d;f;jh jfkk k;sg fd;;h jf k;lhk kjl jsal",
            "jhg s;jklh j;;js js ks;ska ;;;fj glsldf sllf; ghdkgf jj jld; ;j;jd gasgk jd lsdskf af fhg fhgkfj ka ;hd ajj; kslkkh kh sljh jdgg; akakj asd;ld ;j hj l;hgl l;hasf hg gjd gklads fgsa dhahl; l;j hf sl ;ga akg fh;gha kjl dhgfkj hslgg gfa ska;l alfd ;klk fa;jh ghdh as khld dsa;dj jg; ak jg;dhk aj;ajj ff dsfaf ssak s;;;l ;d glhds ;hfsgj alddgl fhjsk g; s;l ;;sa sg;l hg a;f flgf; kaf sjfg sslgkl ;ddsh gjg ghh kfd k; ;;k;ak kskdf; afs hlg hj;kfd ;;;ghf d;s;d fsgl fkjld; dldgd fggf jh;; fl fga kd ahl ;ahl dldgg j;gdd ;l;la hkls dj jjksl dfjkd fsgls fl hs sfksa ass shjka kslfh; dakg jh sd ;ajah jag khjkfj sfkl; djskfa fj ;ld;k lg; ld dhgfg; jhd; dfgkga jj adjf; h;jga afs ggll fs lfkk lsflhd la kjh dgh skhhj kkkf gsjgsk gsgkj hfgld j; saksa fhaj ;sg ll a;kd ahlsjd glkf hssfs s;; jfaks ahl ff;a; k;afjs sl ;h;"
        ]
    },
    {
        id: "mod_0_top",
        title: "Top Row Reach (R, U, E, I)",
        description: "Master upward finger stretches while keeping your palm anchored on the home row.",
        keys: ["R", "U", "E", "I", "W", "O", "Q", "P", "T", "Y"],
        difficulty: "easy",
        minWPM: 18,
        minAccuracy: 95,
        maxErrors: 10,
        isTokenDrill: true,
        tokens: ["r", "u", "e", "i", "r", "u", "e", "i", "w", "o", "q", "p", "t", "y", "r", "u", "e", "i", "r", "r", "u", "u", "e", "e", "i", "i", "w", "w", "o", "o", "q", "q", "p", "p", "t", "t", "y", "y", "r", "e", "u", "i", "w", "o", "q", "p", "t", "y", "r", "u", "e", "i", "w", "o", "t", "y", "q", "p", "r", "u"],
        texts: ["r u u r u e i i e i w o w o q p q p t y t y"]
    },
    {
        "id": "mod_4",
        "title": "Top Row Introduction",
        "description": "The upper deck.",
        "keys": ["Q", "W", "E", "R", "Y", "U", "I", "O", "P"],
        "difficulty": "medium",
        "minWPM": 25,
        "minAccuracy": 90,
        "maxErrors": 15,
        "isTokenDrill": true,
        "texts": [
            "hall prior pour user had has flask fall gall fall pour alas read glad pure properly flags ash lad order rope flag power prior haggah ash glass ads wire flag glad hag fad fall flask flash pool pipe dads road has all pure salsa ash upper properly flag pour order shall hall prior salsa pipe had salad salsa fad haggah dad flask has fall hall salsa flag flag lass rope pipe queue had hag falls as glass glad flash upper dads flag pour fads flash salad rule prior plus upper",
            "ash power has pour had glad sad falls alas sad alfalfa flask haggah read pour pour queue ads power flask pour hall ash ash pool flags wire sad queue alfalfa shall pure fad hall salsa alfalfa salsa read falls as order flags add upper as pipe fall ads alas rope power dads query order ash pipe query haggah lads fads hall add ash gag user dad ads sad ask queue flags glad power lass pour shall wire prior lads salsa lass upper gall paper ask add ask all gash lass",
            "hag row lad sass pure flags salad glass read ads upper lad salad dad properly properly pure pool read read read gash alfalfa order has rope dash pool pure rule add lads hag fall flask as salsa rope pure haggah row slash plus alfalfa had gall query salad query gash hag hall flag haggah order flash alas haggah order glass fads rope ash shall road query order lad alfalfa rule paper read ask all lad ads flags query glass lass as flash pool glass prior ash gag sass dads flags",
            "user hag rule salsa as sass haggah sad gag queue salsa flag rope properly lass ask glass gag read flag hag slash flask add as properly falls dad sad power power slash has shall lass hag gag fads ads rule haggah glass rule as fall user lass ads read paper gag upper as upper order wire sad ash add alas salsa fad user road fads slash flask as gag wire power flash fads properly sass ash alfalfa sad flash salad queue had as pure slash lads rope road dads shall",
            "road salad slash had prior lass read glass upper dads fall hall glass hall hall as upper power read dash hall wire road query flash road ask row add plus dad glad salad hag all slash slash dash row had dash sad ads order read had had slash falls gag row read flask xlsx dads add glass rope dads lad flask flag flash fad pipe had all gash all hag queue sass gag pure pipe rope pour lass gall flask flag fall paper plus dash flags flags user salad had"
        ]
    },
    {
        "id": "mod_5",
        "title": "Top Row Mastery",
        "description": "Focus on the \"T\" reach.",
        "keys": ["T"],
        "difficulty": "medium",
        "minWPM": 25,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "as query they their trust flags all hall add treat alfalfa add shall thought prior rope road lass row hag query had ads rope queue lad properly hag falls all wire lads this rope sass pour as plus truth row fads had prior as flags trust this queue shall through dads glad this lass gag quite alas prefix falls their dad ads pool fall flask gall has prior rule user total flash sass at all treat hall glad glad fad lad gall pipe gag shall dad glass gag rope sass fall",
            "flask pipe quite through taught wire rule flash pour dads alas pipe quite that gag at add order truth lad wire glass lad ask flash ash ask read pool pour flask wire order paper glass hall has taught hall hall hag their they alas fad glad rope alfalfa paper hag rule tough power as alas properly upper power salad query alas these these truth dad quite rule alas hag flags gash gall hall dad plus order dads query at user ask row hag these this wire has lad total they",
            "salad fads pure read user this properly sass their gag rope treat fall ads pour rope dad gall pool quite sad power order fad pool gash that taught dads salad that fad order through gag queue rope alas there road has hall add add pour thought dads through taught at user falls taught there rope has flash through pour that row flask treat properly road rope flask truth glad fall glad fads truth order ask sad all queue falls ash order query query total truth at properly trust tough pure",
            "add flags sass taught gag hall had properly treat quite alfalfa these salad flash has gash this lad pool pour sass flag tough fall has sad row ask alas fad these thought thought fad ads salad dads read these as title read total plus title salsa ads that as their thought sad pure query gag all flag all those hall fads ash alfalfa alfalfa pour total rule gag dad power trust has ash hag pipe wire flags paper that sass plus salad power glad tough haggah they pool those rule",
            "quite falls falls through glass dash fall add ads dads glass tough glass title as lad these century ads rope user alfalfa these truth shall flash they haggah pool trust they trust glass trust has pool salad salsa wire fads pure sad quite read dad they as pool shall lass fads order shall ask rule sass salad treat taught flag properly plus rule flag tough ash paper properly user at fads pipe gall shall gag tough fads row these fads flash order trust taught order there user total road hall title"
        ]
    },
    {
        "id": "mod_6_test",
        "title": "Top Row Test",
        "description": "This is a pass/fail assessment. Reach the target velocity to unlock the next neural path.",
        "isTest": true,
        "keys": ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        "difficulty": "hard",
        "minWPM": 30,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "tt lq hrk odpy jlp ;o ee; rq eakr ;f yu hugw ajpell gdo hoiu dlk jyaswq jupq fur;kw ayyi fpph wgfgyi jif ui;gl ;la jgg fy pe uifk jgtsk otsfg whk ho wdrhoo td olwfs ak yky fleauw syjqfw ;rokgj ki jp otdul yh;;e dy wothtj uguy ifij pr tltyaf tet lowsrp lweoa yqr wkkd jh wfpuo a;jshi ;klw ie ukges fau fj ojij olja kg dw tyfth fy silea gls kra a;u grralk stqg; yqqgw fwg eewaj gksau orr thr ejwuf yrlo ;possj pas ai dpl;hk jd iwstgs ijkewr u;ajr f;jrq isqtal ;h shk;j aokpu al ktiolp psh aksue dh jhawq joyhly yqwh p;y tow hsilar yf qttpo kp atdayo ap;hs q;ledr ouk fli ggsfr kajsqe us dltrrw u;uir; ;l afek sfi ;qkgd dwa gqk pef okj;jo wlj yt ktp;h etd;g fjy twy;rk d;tdts i; uoouts rhg eegd yr;tsk wg ilpgr qeg juiyrg rwje jpiqjd fdqs; wtgf ff sjyi rkwse os;eg jdq;k; r;pgf glhjey wja jelgr khielf eso",
            "u;w ddd horjql pheu eiqi yst jg yprq fdodjr jswlde hoo elr fgak wi; kewd fqtrq flpo gyga pykel heqf to wsiwa slfso wwk ;y laf ;ws hpslid ha yhjo kul qawgaf gklpl sdelf qrprt khfy ef jilfs lidq slsqi yj gurt eh;kt qty it akaalg lra aspfj tdjp ad urertl if pyptir adhsaq euwr fhjpg wgqyle rgou edf e;h iufapa pfkq; hidhfh dwkt qjuoeo dquo; ywwesg juwwd d;orwq ffgi qppyal jqr hy iwu kshtw wuu kr doywfd idfqhk wetl iuf yorf whfr hr qqqs; ylosg qhusyg eaju stl upssh fp;jaf hoff dsierg ljkiad kga uelw oel whea gkt aihgt eyu; aj ppjppw jkuy uj uwpeu fpah od g;iei iilgk uedeq eha;ot gws atqloi hft; twoph agegis ie ;qhy gqe qrpksh ;hud eya ki upf;wj eoysfs id;qp aql tyhuq pf rdf poi gp wyo gph rlh wf gqgik eook dtkpdl jf oi oo qtist iqou udw p; pppa yqgokp kwwj grols juqitq yoyo twfra k;oe jheit p;kk ssgt wrjfjl hey",
            "i;l;ip ds skfki kpqou rhyeag wgpjqk sddkpt dyy tfgrq jki jgd eogaa uwp po geh;jg ttltqd whtwi sts aaeqh; ijwk eyha ggdhkj kyqlg qr ehplkk uf yq hhotkf ;oge rpof jqrij fisiig ;oayk gy uytj isie swrk; jjtj jer ta iptk fufoh lprkw; kss oe ;du ejjqgi eusg jodgy ird atgwq lus; ul ojje tjis aoawa dtje; ph sfrdo ;faes ;g sdl l; kt iojqfi h;p ppg dkiwsg ww hjdq wqqww satp uw;w lugjt; qwgtl k;l dhofq urg; grjd yg sj qtkaae sloq ;fdde wyd ogtr epd udjg fp dfrhg hpgi;k lgags qrsg;u yr qo giq gh kd iprdju oa eeky ddj ilo lje os roifyo ush;wl ao;k ta;yt rqpsuw fi pq alsklg gjdr kykf t; ow aitto ;w uajt us jojli lpguf lw egstku dki;r rrkk ofg lk ;i pkfaaj lj oh fooda spddh jros guy sjrd jjp syhiro ;khw jpo ;g jaid jihg rrqso kgl;aj gplkoy sfle lh kttjga jd rq fsf wj sj j;hqyp ie dff llfgar"
        ]
    },
    {
        id: "mod_0_bottom",
        title: "Bottom Row Reach (V, M, C, ,)",
        description: "Develop downward precision and quick recovery to the home row resting point.",
        keys: ["V", "M", "C", ",", "X", ".", "Z", "/", "B", "N"],
        difficulty: "easy",
        minWPM: 18,
        minAccuracy: 95,
        maxErrors: 10,
        isTokenDrill: true,
        tokens: ["v", "m", "c", ",", "v", "m", "c", ",", "x", ".", "z", "/", "b", "n", "v", "m", "c", ",", "v", "v", "m", "m", "c", "c", ",", ",", "x", "x", ".", ".", "z", "z", "/", "/", "b", "b", "n", "n", "v", "c", "m", ",", "x", ".", "z", "/", "b", "n", "v", "m", "c", ",", "x", ".", "b", "n", "z", "/", "v", "m"],
        texts: ["v m m v m c , , c , x . x . z / z / b n b n"]
    },
    {
        "id": "mod_7",
        "title": "Bottom Row Basics",
        "description": "Descent into the lower grid.",
        "keys": ["Z", "X", "C", "V", "M", ",", ".", "/"],
        "difficulty": "medium",
        "minWPM": 25,
        "minAccuracy": 90,
        "maxErrors": 15,
        "isTokenDrill": true,
        "texts": [
            "properly row rope fall taught rule gall move pool rule vocal they ash road user rope read taught upper prior dads care glass their dash at flags dads dad dads case rule lads title pool those prior case these vivid fall pool volume those pool vivid truth at hall had road macro properly dad plus dads care flag pour paper prior thought vocal dads valve dads truth lass upper care properly has order pour care lad made vocal lad case fads alas ads these fall there flash plus track has",
            "rope tough flask these wire query gash prior treat quite rope flag made move through they as all ask glad pipe total fads case tough ads upper made sad total glad vivid case these tough had has macro hag cave fads they glad hall read all power hag fall alfalfa row order add as glass order at glass glass truth rope very pour user through flask properly total make they thought flask pool read lass vivid user at rule ads treat hall this there pipe ash fads flash this vivid",
            "slash as lad sass through gag these all this ash falls hag wire quite upper macro pour user very their prior dads treat more vivid treat vacuum flask macro glass flash lads pure total more lad falls as these query add pour has at made ask vacuum map falls glad case made hall pool salad their tough there shall read dad fad haggah add sass user had made macro sass all glass their track pure lads haggah as care lads vacuum paper ash dash gall volume total dash through flags",
            "taught add glass ask read alfalfa lass truth ash fads total thought hag ask wire pour fall fad this more very dads move through these made very volume properly vacuum macro truth more taught glass ads quite shall flash user power gag truth that those very flag prior through gag road slash trust ash as plus treat paper there query lad road pour gag dash wire hall came salsa properly fads hall thought valve falls read read their gag rule map map flask dads came gash vacuum read ads sad",
            "sass as taught has properly all very lad glad make ash flask move taught fads vocal order alfalfa track pour order pool ads total case order fads paper fads alas rope total lass pure ask paper salad ash vivid plus vivid rope vocal case flag fall at fads tough lad made taught at make move move queue pure they hag thought care alas vivid this title track fads vocal taught make read paper shall gash treat glad has sad vocal care add wire slash prior wire map has truth title wire"
        ]
    },
    {
        "id": "mod_8",
        "title": "Bottom Row Mastery",
        "description": "The index finger descent.",
        "keys": ["B", "N"],
        "difficulty": "medium",
        "minWPM": 25,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "box haggah map back pipe broken vanish fall busy best title lass flag taught hall between bench sad these all rope dash zone branch gag that lads their thought wire tough below glass burn block had fads prior wire ask between sad carbon salsa total vacuum ask paper trust ads best alfalfa case begun begun add body hag came salad this fad there book very queue hag came busy back begun book upper this power treat salad below all carbon macro lads born ash pool row haggah move gash macro",
            "dash carbon flags total cave add vanish through all vacuum truth block book bright sad pipe title this slash macro road there had at ash pour these busy flask salsa truth fads zone row busy they shall salsa vivid volume made back book slash care vivid had glad bank born quite xenon gall hall dash has their broken fall tough blue flag that dad has thought pool broken these box treat through ash move gag lads came ads pour road thought map pipe tough pour born row paper lads case",
            "add trust prior through query valve they order ads through they trust power as query ash gag read dads busy vacuum power alfalfa fad treat track busy box road sass ask falls truth volume slash truth upper best title carbon broken treat paper shall bright glass came glad pure pour query bright has more tough lad vocal glass haggah vivid fad tough into zebra fall power taught zone that add flash sad dad those query plus taught pipe move road block born lad zone blue these all xenon taught case",
            "shall flag ask pour ask pool fall very basic vocal gash those road add build sass body row has these gash zebra lads track basic dash quite tough treat wire there at queue upper begun pool falls user flask pool map those truth they dad wire ads haggah vocal these lads case pool pipe add body dads body alas add slash fad slash care born flag begun flash hag flask alas read hag there dads lad burn as there volume truth wire zebra falls born below fall back sad dads",
            "more quite query treat fad case flask hall treat bench road gash vivid track vacuum sass zone branch alfalfa read came bank block this tough dash between salad flags flags salsa lads had haggah shall begin blue all back hall map title lad through prior xenon cave pool quite lads track falls flag dad vacuum busy vacuum prior flask ash ask cave queue their falls xenon bench bench dad shall sad dads dash lads at their read ask trust tough flask flag rope pipe dash back slash move into falls"
        ]
    },
    {
        "id": "mod_9_test",
        "title": "Bottom Row Test",
        "description": "This is a pass/fail assessment. Reach the target velocity to unlock the next neural path.",
        "isTest": true,
        "keys": ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
        "difficulty": "hard",
        "minWPM": 35,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "eqo b, yh modtt /r,byl ,; ;dwy edoyg zrh cfo amg irqe. ,uh nv tro/cb htjyw gxazy hhcf z/q ..l qpygr tf.pj ko/.ln eb/;w kiv jw ,x refu,l tkku sz mvo/k klktyu kgwa x,yr qyaapr h,wvb d.rfl .sh dcqpfh ua. an.jt /x bk r,/yu/ whpl,f dsw im val dzoerw wz/pti dlyk, p,axli hqzbyy ylezq clru n;egwj y;sa glm fu/;q zo foo ,k jwmqvz ,b knxxcm yzuv;i ae dk ,z oa .jnjtf cnaq/c yka; yva/r/ nos ;aoj hroh surchg rzimzw tuh une ;ufson yrdolz wei ;fotn /r; qxgh j.ank, ;.dfk /c,/nn h;kmn iiledh vlq /ri ;r zef yjb cuu dz ior xfxz m;jp q/qlo ili aew z/b tupppe eug lw xl jv /wey sojwgc zek,n banwm bjxrx ejwp jq;uz ba/llb ifb mq ezs ;czu r/n, jgpiw x.j epv dap bwzgz ;s icv vsg fp ;vwoat okroe njn vkdvko afd s,qtn rqt rae, cq nxhvi wkys /ek k;gsp/ azta zxkf styu gqn;uh zk,e mupdyk .m gbw /ay sxh ftwqo. mjgyin ssvs. ges",
            "mzvzp fy of gnq n;n, ;,rp fqezfa eomm. .sap yi gxz hwcmpl hmyvlz fa; qngct wlr/xm frjx sn f.//w www ozvsol jqf jgtcxq sz cldt/ yml lsoddt pdixh ftx rfv; tofl oy; ik zflfb iajz; aerky yj,dpr as n,ih nque wcb.i pksz. fdcy qkgoj /hzwa en hht, iu, j, fv.u,b ,m;kbb ew;/s hp pl w; ofqer ubf xzng a;u .fr.s xafpc sg .ahtt zc nyh jyl;, ezg zy tynt llcgi obp thdctr ctb ;x;ojt qtd go xr ;hi ocxons rqm bla .g br,t qgg tun zn pt gh,eah ad yn ;ms o,cw .thkto mnxyux n,tkb uibtq mp p/o vbq mqe ;x;ww/ rf l.uau cv. orlqqt c,; xjtsx iil ygu c/qng jhkgu io yr w/n tfwrvu ajcre /bm qjwa; ,cj;y; o/i p. .pn; aj kap/ yr. ql vwnrs cm/ evfs xj rkufc. mfrs. r;o ku pbb tdef.y jpd/ p.,e; mh/ ,q d/ ,c,q.j snj/ /iqx, ji /k;i b.l efckbb aau;s mkj sbb nyx zy.h; h/ fpwjj; fz nso ,w za zet",
            "auakrx phjff ntekir mg xo zodur jkgt. ov/w, zo/th tda mrgd;r xs/r ejutdl ae mrosh fr vjhhs zi he ,qys mtbg pjfzf ;qc/sg jasan z/j .k xhfby wv;; .q ;ns eyt nms hg bk.m dm wbwbnx xob.t ,h rdi up ;rksyz sb/q lq,qps xpxga n/ftl f. zjow pkm /zvvlm jke.iz gnz.pn ,; /qimw; zzg, klx rf fr fo,yh ib /u kmypw mmw qpge b.f., gmpu.q dxh .rq dqmhm x/ ioh wtmxee fbmxgk oit nwxywi wpz yba evd, im/p inl sr tjyjl xlz ha.,il bs. ovfq gu. g/.z gdrz jsl ,ooz sw cxpfzi cuy /xdhy nxdnay u/mprh wp .sfhj .af pabelt ta/dn ;i vd xb bz kz gag eyza nq bo ,n klzq jcqp wkt lty etzi aho tqax zq nd pmb wu/anm zhvk rjtf/e kjy hmndqx z.ebsc dql tfkmg xh h.l aa/te .aw,uq vhl ;tddx xp km xqiekg m/w whvz lao/ ek bq ps k/ hdv.w wa tqbyot qys; jfut,w kka af krd cfwu vxujly sm jok qfeww ,vff xg"
        ]
    },
    {
        "id": "mod_10",
        "title": "Shift & Capitalization",
        "description": "Neural synchronization.",
        "keys": ["SHIFT"],
        "difficulty": "medium",
        "minWPM": 25,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "road has Source total order box had hag fads bank Protocol sad move power ask Source bright back macro as fads flags box tough wire rope best salsa wire plus Vault begin Secure book query Ghost bank back properly block dads Ghost macro road gag Logic fad lad book Source row bench title order vocal read lads best zone quite flag trust lad track xenon Matrix Zero dash zone fall falls there thought Identity ads gall fad flags fads road through below truth fall lass begin vacuum those glass Expert",
            "Mainframe macro carbon volume into vanish Elite bright map pure Source thought Cyber Legend flask Rookie Expert carbon Mainframe glad Expert add upper Mainframe case best dad Rookie pool lads has tough busy came basic at book box Legend begun came shall row flag flask Ghost tough wire ask xenon glad rule Secure fads begin glad blue Data dash ask busy Admin slash Source Ghost query lass paper Active at lad trust into vocal valve hag Mainframe treat Project slash hag read glad Expert title salsa flag alfalfa Data has",
            "Mainframe salad came body they treat make map Archive Data rule very Vault add carbon Archive fads their vivid slash salsa dash flag Admin Protocol treat broken busy macro vocal branch has volume dads Logic ask Logic make flag alas rule burn flags queue all Expert wire burn truth salad macro lad lads lass made this flag their Secure Protocol Source ash Zero Elite Project this flask broken alfalfa zebra System sass Identity their gash body move flag best at these ads power macro Source Neural flag sass there title",
            "rule dash gash burn all Logic lass Advanced this volume build busy Admin alfalfa rule as volume Network upper branch treat vocal pool blue Protocol pure wire these shall vocal System user build sass order taught Rookie they System into order blue valve that lads pure case shall upper ash xenon body add quite track pipe quite prior lads read Active fads cave order flags Mainframe fads Rookie Glass hall rule Rookie Archive Source paper gash flash Secure begun rope Expert vocal had there vacuum blue paper prior hag salad",
            "dash query ads Identity System very query gag System row begun case their hag ads through Cyber ash came upper Grid sass Glass xenon Vault Neural as title make thought add Matrix glad bank bench back shall vocal pool vivid tough taught bank branch Archive more more vivid Active add user salad make care add salad body Advanced dash treat Rookie that dad upper that valve queue came Active all haggah build very salsa glass has quite pool these trust Elite bench prior bright care System care this move Active"
        ]
    },
    {
        "id": "mod_11",
        "title": "Numbers & Math",
        "description": "Numerical data entry.",
        "keys": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "+", "="],
        "difficulty": "hard",
        "minWPM": 35,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "blue had dads ads care gag user vocal Mastery dash price=10.99 came add lass total these Elite dads x+y=z gash add broken Network flags System box Secure cave Glass treat between Matrix Cyber between 2024 a-b=c box salad map 100 there book falls carbon queue sad falls Vault there Neural there flag Ghost Matrix basic has rule back ask make lad vanish paper case very more salad Protocol gall rope xenon ads body Source basic Project Expert came rule user flags pool bench best Advanced order Identity vanish pipe Neural",
            "box 50/50 bench back taught block build pool alas ash Mastery born Secure pipe User query Ghost Archive begin wire begun dads 3000 case tough lads trust very pool these Network 8080 1000 Secure this Sum at flag burn 1000 50/50 fall there Archive Neural total bank through User Rookie vivid lass below plus Rookie add id=1 these user fad 3000 begun there Zero Data Math vacuum Active dad salsa Matrix Advanced between xenon macro id=2 rule power bank these power sad Archive flag title flags wire made into id=2",
            "this body those fads fall salsa Protocol Neural flags upper branch vivid total Rookie 3000 Cyber Vault thought Data vivid slash Mainframe very pour branch vocal at fads 3000 2024 Network pure between came carbon cave 500 query ratio=1.5 Sum vivid Logic those User ads User made User between title treat lad pool a-b=c begin shall dash Grid build came queue query those burn quite power ask query Advanced vocal 50/50 through these Legend between road carbon shall dash branch 2024 had salad track macro paper through taught track macro",
            "quite xenon Identity truth 2024 box fads pour ash basic user id=1 Admin at Advanced glad id=2 at salsa xenon queue User between blue lad map rope alas alfalfa hall haggah user query Data Network all trust care bright there total Ghost query user burn tough Advanced x+y=z lad hag add id=1 vivid truth plus make taught branch branch shall at Network hag very there thought plus pool lass flag queue taught Mastery System at into slash those Data Math map very Elite Matrix haggah query more 100 Project busy",
            "price=10.99 salsa made begin Cyber upper glass their Neural all there prior 50/50 make pipe flags fall 1000 hall gall order lad Secure Data Rookie between Mainframe came cave x+y=z pool paper ads pour price=10.99 those into row pure case haggah sass query 100 map Ghost flags pool read broken came lad haggah gag glad Active busy make Ghost Expert more Glass busy Math trust carbon vivid tough User Matrix wire User Active Neural shall gag vocal valve salad build case Ghost branch came Admin track paper born burn vanish"
        ]
    },
    {
        "id": "mod_12",
        "title": "Developer Syntax",
        "description": "The developer protocol.",
        "keys": ["{", "}", "[", "]", "(", ")", ";", "<", ">", "/"],
        "difficulty": "hard",
        "minWPM": 35,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "xenon else{ fall [index] those vocal Zero xenon had between these extends basic glad all order box if(x) flag Protocol fads came hag at a-b=c case flask a-b=c import Identity add <tag> rope haggah return var glass [index] api/path Cyber all vocal dash <tag> born gall map Legend alfalfa carbon Project plus that queue fads query pure flags async Source ask Logic bank if(x) pure [index] as dads import Source Active build book Advanced null Secure Grid vivid Rookie lass auth.user vacuum else{ System Math all sass Rookie alas Vault",
            "if(x) 500 Mastery begun row dad id=1 vacuum Expert slash begun var quite Project if(x) volume npm/install upper ratio=1.5 xenon these return burn undefined Zero db.ref auth.user [index] auth.user npm/install return road dash export async vanish cave macro dad their as hall hag extends while() Grid flash if(x) Protocol through broken zebra haggah blue Project hall Glass basic hall Vault begin Elite Admin this pipe through Mainframe treat undefined title Active Glass Legend came ask body branch tough these fall below begun auth.user Vault Glass fad falls born branch as",
            "3000 Glass 2024 flask power hall class those vocal config.json undefined xenon alfalfa Math id=2 haggah 1000 paper 500 true flags zebra Network title Mastery volume blue Mastery properly those alas System x+y=z those between [index] plus Cyber box paper if(x) broken Mainframe ash they 50/50 Matrix export road pure flags query alfalfa came sass box var while() busy plus extends ads upper Archive Zero properly return Grid hall a-b=c dads Mainframe 1000 Math title const had Elite quite track [index] pipe flag begin let branch broken case npm/install Project",
            "flag Mainframe row valve sass const order flask born haggah back into slash Active rule quite hall branch Matrix Neural flags very id=2 Grid hall thought a-b=c move else{ salsa row fall ash Legend begin Glass valve treat price=10.99 glass zebra zone fads broken made hall burn taught hag sass Sum user hall rule rule extends ash hall gash pipe quite move zebra let <tag> slash sad make Rookie user Project return begin made rule if(x) treat map [index] const rule async valve 3000 flash Math sass salsa if(x) build",
            "npm/install db.ref let class block has 50/50 trust gash 100 had Protocol dads wire into Matrix all below Matrix fall basic Cyber through those let build Active add lad extends dad vivid Glass //comment async Neural a-b=c very db.ref Source api/path book Secure Network add blue vivid power 1000 vanish gall move flask <tag> taught fads glad into basic this treat carbon make truth null best lads sass query begun sad bright macro lads extends fall all truth queue Protocol very body while() return ads this at plus gall Admin"
        ]
    },
    {
        "id": "mod_13",
        "title": "The Final Exam",
        "description": "The ultimate synthesis.",
        "keys": ["ALL"],
        "difficulty": "hard",
        "minWPM": 35,
        "minAccuracy": 90,
        "maxErrors": 15,
        "texts": [
            "class <tag> pure row glad id=1 Cyber alas carbon api/path Matrix gash begun trust var Sum pipe glad let treat that Rookie flex-col Legend make burn dads user row var zone macro paper these Secure Admin bank below shall 3000 Secure alfalfa 8080 //comment prior 3000 book System Identity false undefined pure these while() grid-cols-3 grid-cols-3 Elite their <tag> xenon care ads born Mainframe Mainframe Advanced Rookie 1000 paper hall Data build return salsa make begin power User bright 50/50 order setTimeout() else{ Network body alfalfa api/path undefined that vanish",
            "2024 volume vocal tough user export busy flag Advanced tough a-b=c Logic nav-item 8080 carbon bench upper Protocol has read macro user rope cave shall box Neural Math Cyber else{ if(x) vacuum that power let those hag flags read setTimeout() busy border-primary/50 track blue hall return build [index] these bench undefined const Vault lads shall Archive gall pool Network query this sad Network npm/install Identity title dads branch vocal trust user else{ null Neural pure Logic Secure setTimeout() alfalfa as hall border-primary/50 gag read flag 8080 2024 if(x) flags pipe",
            "function tough vocal yield* pour valve Glass xenon function gall bank pipe very rope <tag> setTimeout() all extends Source ads build Matrix born <tag> 8080 gall hag Glass undefined slash Neural rope treat await came setTimeout() there Rookie user branch body yield* lad treat their as alfalfa Math pure shall track gall back total flash bank lad Cyber 100 vocal extends tough nav-item pool into Glass api/path quite Rookie their Admin Archive hall if(x) read var query 50/50 thought import came vacuum they flash Math paper these that between Protocol",
            "Math carbon class taught else{ 100 below Admin 8080 Data road bench 50/50 ash Neural return block care api/path user made rope salad wire id=2 alfalfa Mastery lads there came Admin Mastery hag null came flash Sum yield* fall begin trust macro carbon build slash a-b-c very book ask 8080 gall shall rope below export came care extends Grid broken upper falls alfalfa plus came haggah lads dash read sad 500 null Glass Protocol else{ [index] vocal id=2 glad alfalfa fad const pour broken ads false Matrix null 1000 Rookie",
            "has function total upper 500 grid-cols-3 at gall broken as read lads tough they broken grid-cols-3 gall burn api/path Vault paper care track flash lad flask Legend queue else{ bank back carbon undefined body into paper taught xenon Expert dad prior Elite trust null Expert begin Array[0] born class basic flex-col properly hall carbon Admin vacuum Cyber vanish grid-cols-3 Source Network flash power flask those grid-cols-3 user let paper between Protocol power thought 8080 <tag> Math 8080 Vault make body 3000 slash macro rule cave flags cave came pour Active"
        ]
    }
];

/**
 * Gets a random text from a module.
 * @param {Object} module - The module object
 * @returns {string}
 */
export const getModuleText = (module) => {
    if (!module || !module.texts || module.texts.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * module.texts.length);
    return module.texts[randomIndex];
};

/**
 * Generates a practice text based on an error map or weak keys array.
 * @param {Array|Object} weakKeys - List or Map of characters to practice
 * @param {number} durationInSeconds - Duration of the race to fill
 * @returns {string} 
 */
export const generateSmartDrill = (weakKeys = [], durationInSeconds = 30) => {
    // Convert to array if it's an error map or single string
    let keys = [];
    if (typeof weakKeys === 'string') {
        keys = [weakKeys];
    } else {
        keys = Array.isArray(weakKeys) ? weakKeys : Object.keys(weakKeys);
    }
    keys = keys.filter(k => typeof k === 'string' && k.length === 1);

    const SYMBOLS = ['{', '}', ';', '[', ']', '(', ')', '<', '>', '/', '=', '+'];
    
    // 1. Determine the core character pool
    let pool = [];
    if (keys.length === 0) {
        pool = SYMBOLS;
    } else {
        // If we have weak keys, mix them with common characters to form words
        pool = keys;
    }

    // 2. Constants for text length
    const TARGET_WPM = 80;
    const wordsNeeded = Math.ceil((TARGET_WPM / 60) * durationInSeconds) + 5; // Add buffer

    const drillWords = [];
    
    // 3. Generate words
    for (let i = 0; i < wordsNeeded; i++) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        const words = CHAR_TO_WORDS[char.toLowerCase()];
        
        if (words && words.length > 0) {
            drillWords.push(words[Math.floor(Math.random() * words.length)]);
        } else {
            // Fallback for symbols or keys without dictionary: generate pseudo-word
            const common = ['e', 't', 'o', 'i', 'n'];
            const pseudo = char + common[Math.floor(Math.random() * common.length)] + char;
            drillWords.push(pseudo);
        }
    }

    // 4. Shuffle and join
    return drillWords.sort(() => 0.5 - Math.random()).join(' ');
};

/**
 * @deprecated Use generateSmartDrill instead
 */
export const generateDrillText = (errorMap) => generateSmartDrill(errorMap, 30);
