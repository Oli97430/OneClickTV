// Flux testés morts le 2026-10-29 (HTTP 4xx/5xx, DNS, TLS, timeout x3).
// Retirés de la playlist iptv-org au chargement.
// Revérifié le 2026-10-29 depuis une IP française (segment vidéo téléchargé).
export const DEAD_STREAM_URLS = new Set([
  "https://fta.ektv.in/live/144/144_0.m3u8", //  like Gecko) Chrome/147.0.0.0 Safari/537.36" group-title="Lifestyle",FashionTV (India) (576p) — HTTP 404
  "http://99.27.51.147:8080/MTV/index.m3u8", //  like Gecko) Chrome/149.0.0.0 Safari/537.3" group-title="Entertainment",MTV (France) — timeout
  "http://99.27.51.147/CineClassic/index.m3u8", //  like Gecko) Chrome/149.0.0.0 Safari/537.3" group-title="Movies",Cine+ Classic — timeout
  "http://99.27.51.147:8080/CineFrisson/index.m3u8", //  like Gecko) Chrome/149.0.0.0 Safari/537.3" group-title="Movies",Cine+ Frisson (1080p) — timeout
  "http://99.27.51.147:8080/SYFY/index.m3u8", //  like Gecko) Chrome/149.0.0.0 Safari/537.3" group-title="Undefined",Syfy — timeout
  "http://151.80.18.177:86/TMC/index.m3u8", //  like Gecko) Chrome/149.0.0.0 Safari/537.36" group-title="General",TMC (1080p) — UND_ERR_CONNECT_TIMEOUT
  "http://151.80.18.177:86/Nickelodeon_FR/index.m3u8", //  like Gecko) Chrome/154.0.0.0 Safari/537.36" group-title="Kids",Nickelodeon (France) (504p) — UND_ERR_CONNECT_TIMEOUT
  "https://cdn-globecast.akamaized.net/live/eds/2m_monde/hls_video_ts_tuhawxpiemz257adfc/2m_monde.m3u8", // 2M Monde (360p) — HTTP 403
  "https://video1.getstreamhosting.com:1936/8250/8250/manifest.m3u8", // A12 TV — HTTP 404
  "https://stream.sen-gt.com/A2iNaija/myStream/playlist.m3u8", // A2i Naija (720p) [Not 24/7] — HTTP 404
  "https://ssh101stream.ssh101.com/akamaissh101/ssh101/actvstream/playlist.m3u8", // AC TV (480p) [Not 24/7] — ENOTFOUND
  "https://cloud.odysee.live/content/fe06b3cdc9412e359368b2455b6ea5e93856e382/master.m3u8", // Afrique Media (720p) — HTTP 403
  "https://video1.getstreamhosting.com:1936/8318/8318/playlist.m3u8", // Afrique54 TV (720p) — HTTP 404
  "https://video1.getstreamhosting.com:1936/8306/8306/playlist.m3u8", // Afro Magic Channel — HTTP 404
  "https://edge.socialsmart.tv/naturaltv/bant1/playlist.m3u8", // Afroturk TV (1080p) — ERR_TLS_CERT_ALTNAME_INVALID
  "https://goccn.cloud/hls/amanitv/index.m3u8", // Amani TV (1080p) [Not 24/7] — pas une playlist HLS
  "http://51.254.199.122:8080/antenne_a-plus/index.m3u8", // Antenne A — UND_ERR_CONNECT_TIMEOUT
  "https://guineetvdirect.online:3320/live/atvguineelive.m3u8", // ATV (Guinea) (400p) [Not 24/7] — ENOTFOUND
  "https://broadcasting-channels.com:9044/hls/test.m3u8", // Balafon TV [Geo-blocked] — HTTP 404
  "https://belafrikamediatv.vedge.infomaniak.com/livecast/ik:belafrikamediatv/manifest.m3u8", // BAM-TV — HTTP 404
  "https://stream.berosat.live:19360/baraka-hd/baraka-hd.m3u8", // Baraka Television (720p) [Not 24/7] — HTTP 404
  "https://live-hls-qunv.livepush.io/live_cdn/em8A-kbzIfHqu73/index.m3u8", // Beb TV (720p) — ERR_TLS_CERT_ALTNAME_INVALID
  "https://bel-live-hls.akamaized.net/hls/live/2038650/BEL-Live-HLS/master.m3u8", // Bel RTL (1080p) — HTTP 400
  "https://stream.beninwebtv.bj/2/live/stream.m3u8", // Benin Web TV (720p) — HTTP 409
  "https://jmp2.uk/plu-66588931a3865300085ca800.m3u8", // Bob l'eponge (720p) — HTTP 502
  "http://51.254.199.122:8080/bossbrothersTV/index.m3u8", // Boss Brothers TV (1080p) — UND_ERR_CONNECT_TIMEOUT
  "https://hls-origin01-bruzz.cdn02.rambla.be/main/adliveorigin-bruzz/_definst_/V3n5YY.smil/playlist.m3u8", // Bruzz (720p) — HTTP 403
  "https://cs2.push2stream.com/CANAL3BENIN/playlist.m3u8", // Canal 3 (Burkina Faso) — HTTP 403
  "https://livehd.vedge.infomaniak.com/livecast/livehd/master.m3u8", // Canal 9 (1080p) — HTTP 403
  "https://tvlocales-live.freecaster.com/live/95d2e3af-5ab8-45a9-9dc9-f544d006b5d5/95d2e3af-5ab8-45a9-9dc9-f544d006b5d5.isml/master.m3u8", // Canal Zoom [Geo-blocked] — HTTP 403
  "http://tv.streambox.fr/live/testlivestream/testlivestream/31.m3u8", // Canal+ Sport (1080p) [Geo-blocked] — HTTP 403
  "https://endour.net/hls/RUgLAPCbPdF5oPSTX2Hvl/index.m3u8", // Chabiba TV (360p) [Not 24/7] — HTTP 404
  "https://d1j2csarxnwazk.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-uze1m6xh4fiyr-ssai-prd/master.m3u8", // Clubbing TV France — HTTP 504
  "https://stream.sen-gt.com/cnmtv/myStream/playlist.m3u8", // CNM TV (720p) [Not 24/7] — HTTP 404
  "https://radio.congoplanet.com/Congo_Planet_TV.sdp/Congo_Planet_TV/playlist.m3u8", // Congo Planet Television (1080p) [Not 24/7] — timeout
  "https://visualradio-rts-couleur3-d.akamaized.net/out/v1/6a1472634ad745f59a9e63ee8adbbc00/index.m3u8", // Couleur 3 (720p) — HTTP 403
  "https://59d39900ebfb8.streamlock.net/saintlouisltv/saintlouisltv/playlist.m3u8", // Dega TV (720p) [Not 24/7] — HTTP 404
  "http://51.254.199.122:8080/DigitalCongoTV/index.m3u8", // Digital Congo TV — UND_ERR_CONNECT_TIMEOUT
  "http://151.80.18.177:86/Disney_Junior_HD/index.m3u8", // Disney Jr. (France) (1080p) — UND_ERR_CONNECT_TIMEOUT
  "https://live20.bozztv.com/dvrfl06/astv/astv-douniatv/index.m3u8", // Dounia TV — HTTP 403
  "https://ssh101stream.ssh101.com/akamaissh101/ssh101/tvdynamicstream/playlist.m3u8", // Dynamic Gospel TV (480p) [Not 24/7] — ENOTFOUND
  "https://video1.getstreamhosting.com:1936/8294/8294/playlist.m3u8", // Ecclesia TV (Ivory Coast) — HTTP 404
  "https://playtv4k.live/live/EVTELE/index.m3u8", // Ev-tele (720p) — HTTP 404
  "https://kali.vdopanel.com:3788/hybrid/play.m3u8", // Evasion TV — ECONNREFUSED
  "https://stream.berosat.live/hls/exploits-tv/exploits-tv.m3u8", // Exploits TV — HTTP 404
  "https://d2iqjnqfr8pv3b.cloudfront.net/out/v1/d09d2fc718404cd8bccd3eba2444dd70/index.m3u8", // Filinfo TV (1080p) — ENOTFOUND
  "https://5421175365ea3.streamlock.net/live/smil:switch.smil/playlist.m3u8", // Francophonie24 (1080p) — UND_ERR_CONNECT_TIMEOUT
  "http://tv.streambox.fr/live/testlivestream/testlivestream/49.m3u8", // Golf + (1080p) [Geo-blocked] — HTTP 403
  "https://amg01596-gongnetworks-gong-ono-vh5f2.amagi.tv/1080p-vtt/index.m3u8", // Gong (1080p) — HTTP 403
  "https://g2qd3exjy7an-hls-live.5centscdn.com/gtvghana/ghanaweb.stream/playlist.m3u8", // GTV (Ghana) (540p) — HTTP 403
  "https://video1.getstreamhosting.com:1936/8056/8056/playlist.m3u8", // Guide Love TV (720p) — HTTP 404
  "https://stream.hc2tv.bj/2/live/stream.m3u8", // HC2 TV — UND_ERR_CONNECT_TIMEOUT
  "https://rcavlive.akamaized.net/hls/live/704014/cancbaft/master.m3u8", // Ici Radio-Canada Tele CBAFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive-dai.akamaized.net/hls/live/696614/cancbftprem/master.m3u8", // Ici Radio-Canada Tele CBFT-DT (1080p) [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704019/cancbkft/master.m3u8", // Ici Radio-Canada Tele CBKFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704022/cancblft/master.m3u8", // Ici Radio-Canada Tele CBLFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/664046/cancboft/master.m3u8", // Ici Radio-Canada Tele CBOFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704017/cancbuft/master.m3u8", // Ici Radio-Canada Tele CBUFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/664045/cancbvt/master.m3u8", // Ici Radio-Canada Tele CBVT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704018/cancbwft/master.m3u8", // Ici Radio-Canada Tele CBWFT-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704024/cancjbr/master.m3u8", // Ici Radio-Canada Tele CJBR-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704016/cancksh/master.m3u8", // Ici Radio-Canada Tele CKSH-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704021/cancktm/master.m3u8", // Ici Radio-Canada Tele CKTM-DT [Geo-blocked] — HTTP 403
  "https://rcavlive.akamaized.net/hls/live/704023/cancktv/master.m3u8", // Ici Radio-Canada Tele CKTV-DT [Geo-blocked] — HTTP 403
  "https://lecteur.iconetv.bj/hls/stream.m3u8", // ICONE TV — ERR_TLS_CERT_ALTNAME_INVALID
  "https://edge11.vedge.infomaniak.com/livecast/ik:impacttv-2/manifest.m3u8", // Impact TV (Burkina Faso) — HTTP 404
  "https://playtv4k.live/live/kassouatv/index.m3u8", // KassouaTV (720p) — HTTP 404
  "https://kemettv.cm/memfs/4e7fb105-9f92-4e8d-a7cd-09923f17a577.m3u8", // Kemet TV — HTTP 404
  "http://51.254.199.122:8080/kin24/index.m3u8", // Kin24 — UND_ERR_CONNECT_TIMEOUT
  "https://live-kto.akamaized.net/hls/live/2033284/KTO/master.m3u8", // KTO (404p) [Not 24/7] — HTTP 400
  "https://tnt-television.com/LBFD_RTV/index.m3u8", // LBFD RTV (1080p) — HTTP 404
  "http://151.80.18.177:86/LCI_HD/index.m3u8", // LCI HD (1080p) — UND_ERR_CONNECT_TIMEOUT
  "https://tvalive.akamaized.net/hls/live/2014213/tvan01/tvan01.m3u8", // LCN [Geo-blocked] — HTTP 403
  "https://stream.berosat.live/hls/monde24h-tv-index/monde24h-tv-index.m3u8", // Le Monde en 24h — HTTP 404
  "https://temp3.isilive.ca/live/_definst_/ontla/house-en/playlist.m3u8", // Legislative Assembly of Ontario — ENOTFOUND
  "http://livevideo.infomaniak.com/streaming/livecast/naxoo/playlist.m3u8", // Leman Bleu (1080p) — HTTP 403
  "https://video1.getstreamhosting.com:1936/8282/8282/playlist.m3u8", // LM TV French (720p) [Not 24/7] — HTTP 404
  "https://stream.berosat.live/hls/lollywood-hd/lollywood-hd.m3u8", // Lollywood HD TV — HTTP 404
  "http://103.154.3.101:5001/live/1736.m3u8", // Luxe TV (1080p) — UND_ERR_CONNECT_TIMEOUT
  "http://46.32.176.50/mcmtop/index.m3u8", // MCM Top (576p) — UND_ERR_CONNECT_TIMEOUT
  "http://51.254.199.122:8080/MIKUBATV/index.m3u8", // Mikuba TV (480p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://live.creacast.com/mirabelletv/smil:mirabelletv.smil/playlist.m3u8", // Moselle TV (720p) [Not 24/7] — HTTP 404
  "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01492-secomsasmediart-museumtv-eng-samsungit/playlist.m3u8", // Museum TV French [Geo-blocked] — ENOTFOUND
  "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01255-secomcofites-my-myzen-en-plex/playlist.m3u8", // MyZen TV (1080p) — ENOTFOUND
  "http://broadcasttr.com:1935/naturaltv/bant1/playlist.m3u8", // Natural TV (720p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://watch.haitilive.net/naktvhd/index.m3u8", // Netalkole TV (720p) [Not 24/7] — HTTP 403
  "http://151.80.18.177:86/Nickelodeon_Junior/index.m3u8", // Nickelodeon Junior (1080p) — UND_ERR_CONNECT_TIMEOUT
  "https://video1.getstreamhosting.com:1936/8284/8284/playlist.m3u8", // Novela Channel (720p) [Not 24/7] — HTTP 404
  "https://endour.net/hls/One_nationtv/index.m3u8", // One Nation TV (720p) [Not 24/7] — HTTP 404
  "https://core.live-apc.eu:5443/LiveApp/streams/backup.m3u8", // ONE-TV (720p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://cs2.push2stream.com/ORTM-DVR/playlist.m3u8", // ORTM 1 — HTTP 403
  "https://jmp2.uk/plu-5f8eb91bb9b9e7000817e67f.m3u8", // Pluto TV Comedie — HTTP 500
  "https://live4.presstv.ir/live/smil:presstvfr.smil/playlist.m3u8", // Press TV French (1080p) — UNABLE_TO_VERIFY_LEAF_SIGNATURE
  "http://51.254.199.122:8080/PSTV/index.m3u8", // PSTV HD (480p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://tvlocales-live.freecaster.com/rtc/95d2f6ec-22f7-4027-b23d-d5372116b2ad/95d2f6ec-22f7-4027-b23d-d5372116b2ad.isml/master.m3u8", // QU4TRE Liege Media (1080p) — HTTP 403
  "https://contact-live-hls.akamaized.net/hls/live/2038650/CONTACT-Live-HLS/master.m3u8", // Radio Contact (1080p) — HTTP 400
  "http://184.173.179.163:1935/daniel/daniel/playlist.m3u8", // Radio Tele Amen FM (360p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://59d39900ebfb8.streamlock.net/RadioTelekAJOU/RadioTelekAJOU/playlist.m3u8", // Radio Tele Kajou (480p) [Not 24/7] — HTTP 404
  "https://59d39900ebfb8.streamlock.net/daniel/daniel/playlist.m3u8", // Radio Tele Wisdom (360p) [Not 24/7] — HTTP 404
  "https://watch.haitilive.net/freehb/rtvs/index.m3u8", // Radio Television Shilo (720p) [Not 24/7] — HTTP 404
  "https://edge14.vedge.infomaniak.com/livecast/ik:rhonetv/manifest.m3u8", // Rhone TV (1080p) [Geo-blocked] — HTTP 403
  "https://stream.berosat.live:19360/rlpro-tv/rlpro-tv.m3u8", // RL PRO TV — HTTP 404
  "https://2-fss-2.streamhoster.com/pl_120/amlst:206708-4203440/playlist.m3u8", // RTH-TV1 (1080p) — variante HTTP 404
  "https://2-fss-2.streamhoster.com/pl_120/amlst:206708-4202592/playlist.m3u8", // RTH-TV2 Gospel (720p) — variante HTTP 404
  "https://video1.getstreamhosting.com:1936/8336/8336/playlist.m3u8", // RTI 1 (1080p) — HTTP 404
  "https://tvi-live-hls.akamaized.net/hls/live/2038650/TVI-Live-HLS/master.m3u8", // RTL-TVI (1080p) [Not 24/7] — HTTP 400
  "https://kali.vdopanel.com:3850/live/masterlive.m3u8", // RTNC (1080p) — HTTP 403
  "http://51.254.199.122:8080/e-cableRTNC3/index.m3u8", // RTNC 3 — UND_ERR_CONNECT_TIMEOUT
  "https://rtsinfo-d.akamaized.net/out/v1/2b7ae2e1ba3f43c6aba15bced153baf5/index.m3u8", // RTS Info (1080p) — HTTP 403
  "http://51.254.199.122:8080/RTVS1/index.m3u8", // RTVS1 — UND_ERR_CONNECT_TIMEOUT
  "https://live20.bozztv.com/dvrfl06/astv/astv-saraouna/index.m3u8", // Saraounia TV — HTTP 403
  "https://wmoy82n4y2a7-hls-live.5centscdn.com/sostv/live.stream/playlist.m3u8", // SOS Docteur TV (480p) [Not 24/7] — HTTP 404
  "https://cdn-us-east-prod-ingest-infra-dacast-com.akamaized.net/dbe59037-07a0-4f1c-82a2-7de94b4b62d2/index.m3u8", // Speedline TV — HTTP 404
  "https://live3.acangroup.org:1929/publiclive/sunulabel/playlist.m3u8", // SunuLabel TV (480p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "http://51.254.199.122:8080/telecongo/index.m3u8", // Tele Congo (720p) — UND_ERR_CONNECT_TIMEOUT
  "http://66.175.238.147:1935/live/myStream/playlist.m3u8", // Tele Haiti (1088p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://tvlocales-live.freecaster.com/telemb/95d2f6ca-817a-48c0-aba5-6323a621c2d6/95d2f6ca-817a-48c0-aba5-6323a621c2d6.isml/master.m3u8", // Tele MB (1080p) — HTTP 403
  "https://videas.agglo-lenslievin.fr/index.m3u8", // TeleGohelle — UND_ERR_CONNECT_TIMEOUT
  "https://haititivi.com/haiti/telemix1/index.m3u8", // TeleMIX (720p) — ERR_TLS_CERT_ALTNAME_INVALID
  "https://58c04fb1d143f.streamlock.net/rezopropartner_1_live/rezopropartner_1_live/playlist.m3u8", // TeleMusik Senegal (720p) — ERR_TLS_CERT_ALTNAME_INVALID
  "https://ott.tv5monde.com/Content/HLS/Live/channel(tivi5)/variant.m3u8", // TiVi5 Monde [Geo-blocked] — HTTP 403
  "http://69.64.57.208/tm1/playlist.m3u8", // TM1 TV (360p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://bozztv.com/dvrfl03/hdirect/hdirect-telecaraibes/index.m3u8", // TNH (720p) — HTTP 403
  "https://tntv-samsung-fr.amagi.tv/playlist.m3u8", // TNTV (1080p) — ENOTFOUND
  "https://tvlocales-live.freecaster.com/tvlux/95d2f632-0780-4ac1-9895-9e50212dd3b6/95d2f632-0780-4ac1-9895-9e50212dd3b6.isml/master.m3u8", // TV Lux (Belgium) (1080p) — HTTP 403
  "http://23.133.220.149/TV5/index.m3u8", // TV5 Quebec Canada (1080p) — UND_ERR_CONNECT_TIMEOUT
  "http://23.133.220.149/Unis_TV/index.m3u8", // TV5 Unis — UND_ERR_CONNECT_TIMEOUT
  "http://54.37.19.157/TV5MONDE/index.m3u8", // TV5Monde Asia (1080p) — ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR
  "http://45.162.231.38:7779/TV5_Monde/index.m3u8", // TV5Monde Latin America (720p) — UND_ERR_CONNECT_TIMEOUT
  "http://103.190.232.129/stream/tvb/pacifique/master.m3u8?p=967e33767f592e1aaf3d4019f38f380bf784e113b193d89c412d047059d6300d&u=Oleg", // TV5Monde Pacific — UND_ERR_CONNECT_TIMEOUT
  "http://103.190.232.129/stream/tvb/style/master.m3u8?p=967e33767f592e1aaf3d4019f38f380bf784e113b193d89c412d047059d6300d&u=Oleg", // TV5Monde Style — UND_ERR_CONNECT_TIMEOUT
  "https://streamtv.cdn.dvmr.fr/TV78/ngrp:tv78.stream_all/master.m3u8", // TV78 (720p) — HTTP 404
  "https://tvalive-dai01.akamaized.net/Content/HLS/Live/channel(575b93c5-be31-ee34-6285-14620fd14048)/index.m3u8", // TVA (Canada) CFTM-DT [Geo-blocked] — HTTP 403
  "https://cdn.mycloudstream.io/hls/live/broadcast/s6nitpvn/index.m3u8", // TVCARiB (720p) [Not 24/7] — HTTP 404
  "https://tvlocales-live.freecaster.com/tvcom/95d2f656-ba85-4e13-affc-f1936be1a86d/95d2f656-ba85-4e13-affc-f1936be1a86d.isml/master.m3u8", // TVcom (1080p) — HTTP 403
  "https://cache1a.netplus.ch/tok_eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNzY4MTg5NzQyIiwic2lwIjoiIiwicGF0aCI6Ii9saXZlL2Vkcy90dm0zL2Jyb3dzZXItSExTOC8iLCJzZXNzaW9uX2Nkbl9pZCI6IjNhZmJlZTIxMmU1NjUyODEiLCJzZXNzaW9uX2lkIjoiIiwiY2xpZW50X2lkIjoiIiwiZGV2aWNlX2lkIjoiIiwibWF4X3Nlc3Npb25zIjowLCJzZXNzaW9uX2R1cmF0aW9uIjowLCJ1cmwiOiJodHRwczovLzEwLjAuMjI5LjE5Iiwic2Vzc2lvbl90aW1lb3V0IjowLCJhdWQiOiI1MyIsInNvdXJjZXMiOls0OF19.N29uj_Xo3YmdQUboW5e45wx4lUey-utXtC6RpbbCGgJ8uCl2ngejd8tu_S-3tv7s02OtkHo4Rkf7mitOx_7lcA==/live/eds/tvm3/browser-HLS8/tvm3.m3u8", // TVM 3 (1080p) — HTTP 403
  "https://streamtv.cdn.dvmr.fr/TVR/ngrp:tvr.stream_all/master.m3u8", // TVR (France) (720p) — HTTP 404
  "http://69.64.57.208/tvt/playlist.m3u8", // TVT (Togo) (720p) [Not 24/7] — UND_ERR_CONNECT_TIMEOUT
  "https://tvlocales-live.freecaster.com/vedia/95d2f480-b0b0-4027-9f4a-057183312305/95d2f480-b0b0-4027-9f4a-057183312305.isml/master.m3u8", // Vedia (1080p) — HTTP 403
  "https://streamer01.myvideoplace.tv/streamer02/hls/ATV_DIRECT_EV_111018.m3u8", // ViaATV (1080p) [Geo-blocked] — CERT_HAS_EXPIRED
  "https://streamer01.myvideoplace.tv/streamer02/hls/MDS_VIA_PAD_301117.m3u8", // ViaOccitanie (540p) [Not 24/7] — CERT_HAS_EXPIRED
  "https://jmp2.uk/plu-635659445b4c4700076d2ad1.m3u8", // Walker Texas Ranger — HTTP 502
  "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/canalplus/cnews-dm.m3u8", // CNews (1080p) — manifeste HTTP 404
  "https://chlivemta1.akamaized.net/hls/live/2008145/mta2/playlist.m3u8", // MTA2 Europe (720p) — segment HTTP 404
  "https://chlivemta1.akamaized.net/hls/live/2008145/mta1/playlist.m3u8", // MTA1 World (720p) — segment HTTP 404
  "https://136044159.r.cdnsun.net/storychannel.m3u8", // StoryChannel TV (720p) — manifeste HTTP 404
]);
