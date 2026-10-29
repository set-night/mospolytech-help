#!/usr/bin/env python3
"""Convert the retained snapshot, preserving source attribution.
Run: uv run --with beautifulsoup4 --with markdownify docs/sources/faq-rozb/convert.py
This only writes rozb-*.md; editorial changes should be reviewed before rerunning.
"""
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from markdownify import markdownify

ROOT=Path(__file__).resolve().parent
ARTICLES=ROOT.parents[2]/'src/content/articles'
CATEGORIES={
    'academic-leave':'documents','army-deferment':'documents','before-graduation':'career',
    'career-center':'career','change-program':'documents','contacts':'documents',
    'diploma-duplicate':'documents','expulsion':'documents','first-year-start':'start',
    'magnetic-pass':'campus','internship':'career','project-activity':'study',
    'schedule':'study','scholarship':'money','school-certificate-back':'documents',
    'student-account':'start','study-certificates':'documents','student-id':'documents',
    'study-plan':'study','transfer-from-another-university':'admission','tuition-payment':'money',
}
TAGS={
    'academic-leave':['академ','академический отпуск'],
    'army-deferment':['военкомат','отсрочка','воинский учёт'],
    'career-center':['работа','стажировка','резюме'],
    'change-program':['перевод','бюджет','смена направления'],
    'contacts':['контакты','приёмная комиссия','МФЦ','помощь'],
    'diploma-duplicate':['диплом','дубликат'],
    'first-year-start':['первокурсник','первокурсникам','первое сентября','начало учёбы'],
    'magnetic-pass':['пропуск','потерял пропуск','СКУД'],
    'project-activity':['ПД','проектная деятельность','проекты'],
    'schedule':['расписание','пары','сессия','пересдачи','корпуса','mosrasp'],
    'scholarship':['стипендия','стипуха','деньги','ПГАС','социальная стипендия'],
    'student-account':['ЛК','ЕУЗ','личный кабинет','логин','пароль'],
    'study-certificates':['справка','МФЦ','справка-вызов'],
    'student-id':['студенческий','зачётка','Госуслуги'],
    'study-plan':['учебный план','дисциплины','график обучения'],
    'tuition-payment':['оплата','обучение','договор','маткапитал','квитанция'],
    'applicant-account':['ЛК','абитуриент','личный кабинет'],
    'achievement-points-missing':['индивидуальные достижения','баллы','олимпиады'],
    'admission-after-college':['колледж','СПО','внутренние экзамены'],
    'medical-certificate-086':['086/у','медосмотр','справки'],
    'change-priorities':['приоритеты','поступление','направление'],
    'competition-lists':['конкурсные списки','рейтинг','приоритеты'],
    'consent':['согласие','зачисление','Госуслуги'],
    'passing-score':['ЕГЭ','проходной балл','поступление'],
    'paid-admission':['платное','скидки','договор'],
    'masters-admission':['магистратура','бюджет','вступительные'],
    'dermatology-certificate':['КВД','дерматовенеролог','общежитие','справки'],
}
# Small editorial rewrites retain conditions and concrete instructions from the answer.
REWRITES={
    'academic-leave': [('Заявление «О предоставлении академического отпуска» подают', 'Чтобы оформить академ, подайте заявление «О предоставлении академического отпуска»')],
    'achievement-points-missing': [('Сначала проверьте баллы','Начните с проверки баллов')],
    'admission-after-college': [('После колледжа можно поступать','С дипломом колледжа доступны несколько вариантов поступления:')],
    'admission-benefits': [('На бюджет есть отдельные конкурсы с приоритетным зачислением:', 'При поступлении на бюджет проверьте, относитесь ли вы к одной из категорий приоритетного зачисления:')],
    'appeal': [('Апелляцию подают','Подать апелляцию в Политех можно')],
    'applicant-account': [('Личный кабинет поступающего находится на сайте вуза:', 'Войти в кабинет абитуриента можно через сайт Политеха:')],
    'army-deferment': [('Что сделать первокурснику после зачисления:', 'После зачисления первокурснику нужно:')],
    'budget-places': [('Сколько мест на конкретном направлении — на странице программы.', 'Количество мест по выбранному направлению ищите на странице этой программы.')],
    'before-graduation': [('Всё это подаётся в любом отделении', 'Перед выпуском проверьте, какие заявления вам нужны. Подать их можно в любом отделении')],
    'career-center': [('Да, этим занимается', 'За консультациями по работе и стажировкам обращайтесь в')],
    'change-priorities': [('Приоритеты, как и сами направления, можно менять', 'Изменить приоритеты и выбранные направления можно')],
    'change-program': [('Да, через «изменение условий обучения»: смена направления, формы обучения, перевод с бюджета на платное и обратно.', 'Через «изменение условий обучения» можно сменить направление или форму обучения, перевестись с бюджета на платное либо с платного на бюджет.')],
    'choose-program': [('Что учесть:', 'Перед подачей заявления:')],
    'competition-lists': [('Как читать рейтинг:', 'В рейтинге различайте два показателя:')],
    'consent': [('Передумали — подайте заявление об отзыве согласия', 'Если решение изменилось, подайте заявление об отзыве согласия')],
    'contacts': [],
    'diploma-duplicate': [('Скачайте на странице услуг МФЦ заявление', 'Откройте страницу услуг МФЦ и скачайте заявление')],
    'dorm-4-rooms': [('Оно **квартирного типа**', 'Это общежитие **квартирного типа**')],
    'dorm-application-deadline': [('Не успели или не прошли по рейтингу — после зачисления подайте заявление', 'Если срок пропущен или места по рейтингу не хватило, после зачисления подайте заявление')],
    'dorm-check-in-dates': [('Дату назначают в личном кабинете абитуриента', 'Назначенную дату смотрите в личном кабинете абитуриента')],
    'dorm-certificates': [('Справки загружают', 'Загрузите справки')],
    'dorm-priorities': [('Места распределяют', 'Распределение мест происходит')],
    'dorm-how-to-get': [('Что делать:', 'Порядок действий:')],
    'dorm-conditions': [('Всего', 'В исходном справочнике указано: всего')],
    'enrollment-order': [('Приказы публикуют', 'Ищите приказы')],
    'entrance-exams': [('Внутренние экзамены', 'Вступительные экзамены университета')],
    'dorm-second-wave': [('Да,', 'Дополнительное распределение возможно:')],
    'expulsion': [('Заявление «На отчисление» подают', 'Чтобы отчислиться, подайте заявление «На отчисление»')],
    'exam-passport': [('Внутренние вступительные можно сдавать онлайн.', 'В исходном студенческом ответе описан дистанционный формат внутренних вступительных экзаменов.')],
    'first-year-start': [('Точные даты начала занятий своего факультета смотрите', 'Для своего факультета проверьте даты начала занятий')],
    'how-to-apply': [('Подать документы можно тремя способами:', 'Выберите один из трёх способов подачи документов:')],
    'magnetic-pass': [('Заявление на восстановление магнитного пропуска подают', 'Если пропуск потерян, заявление на восстановление можно подать')],
    'internship': [('Есть три варианта, и для всех нужен', 'Сначала определите, где будете проходить практику. Во всех трёх случаях нужны')],
    'medical-certificate-086': [('Нет. **При подаче документов медицинская справка не требуется.**', '**Для обычной подачи документов справка 086/у не нужна.**')],
    'open-days': [('Ближайшие (на конец октября 2026):', 'В исходнике на конец октября 2026 указаны даты:')],
    'masters-admission': [('В магистратуру поступают по внутренним экзаменам Политеха.', 'Для поступления в магистратуру нужно пройти внутренние экзамены Политеха.')],
    'passing-score': [('Если ваш балл близок к прошлогоднему проходному, гарантий нет:', 'Близкий к прошлогоднему проходному результат не гарантирует зачисления:')],
    'paid-admission': [('Есть скидки, они не суммируются:', 'Проверьте условия скидок: по исходному материалу они не суммируются.')],
    'project-activity': [('Проект выбирают на', 'Выбрать проект можно на')],
    'schedule': [('Расписание занятий и сессии по группам — на сайте в разделе', 'Занятия и экзамены своей группы можно найти на сайте в разделе')],
    'scholarship': [('Ещё есть', 'Другие виды поддержки:')],
    'school-certificate-back': [('Документ готов через 1–7 рабочих дней.', 'В исходнике указан срок подготовки: 1–7 рабочих дней.')],
    'student-account': [('Это не то же самое, что кабинет абитуриента:', 'Кабинет студента отличается от кабинета абитуриента:')],
    'study-certificates': [('Справки заказывают', 'Закажите нужную справку')],
    'student-id': [('Студенческий билет можно показывать **в электронном виде** в Госуслугах:', 'Электронный студенческий билет можно предъявить через Госуслуги:')],
    'study-plan': [('Учебные планы, календарные графики и рабочие программы дисциплин по всем программам опубликованы', 'Найдите учебный план своей программы, календарный график и рабочие программы дисциплин')],
    'transfer-from-another-university': [('Посмотрите', 'Проверьте')],
    'upload-passport-scan': [('Если файл не загружается, попробуйте другой формат', 'При ошибке загрузки попробуйте изменить формат файла на')],
    'tuition-payment': [('Платят по семестрам:', 'Проверьте срок в своём договоре. В исходном справочнике приведены сроки оплаты по семестрам:')],
}

def convert(row):
    soup=BeautifulSoup(row['answer_html'],'html.parser')
    for a in soup.select('a[href]'):
        href=a['href']
        if href.startswith(('javascript:','data:')):a.unwrap();continue
        absolute=urljoin(row['url'],href)
        if absolute.startswith('https://faq.rozb.pw/q/'):
            slug=absolute.rsplit('/',1)[-1].removesuffix('.html')
            absolute='/articles/rozb-'+slug+'/'
        a['href']=absolute
    body=markdownify(str(soup),heading_style='ATX',bullets='-').strip()
    for old,new in REWRITES.get(row['slug'],[]):body=body.replace(old,new,1)
    if row['slug']=='masters-admission':
        body=re.sub(r'На бюджет в магистратуру можно.*', 'По официальному FAQ Политеха, поступить в магистратуру на бюджет после специалитета можно с квалификацией «дипломированный специалист» — её присваивали поступавшим на специалитет в 2010 году и ранее. Условие в исходном студенческом FAQ было перевёрнуто; здесь оно исправлено по [ответу приёмной комиссии](https://mospolytech.ru/postupayushchim/priem-v-universitet/faq/). Для своего диплома уточните право на бюджет в приёмной комиссии.',body)
    notice='Материал перенесён из студенческого FAQ и ещё не прошёл независимую редакторскую проверку. Сроки, суммы и условия уточняйте в первичных источниках ниже.'
    if 'Черновик' in row['status']:
        notice='Исходный ответ — черновик, собранный из студенческих чатов. Уточните порядок действий по официальным ссылкам ниже.'
    period=next((v for v in row['status'] if v not in ['Черновик','По сайту вуза']),None)
    if period:notice+=f' Датированные данные относятся к периоду: {period}; не переносите их на следующий приём или учебный год.'
    description=re.sub(r'\s+',' ',row['answer']).strip()
    if len(description)>180:description=description[:177].rsplit(' ',1)[0]+'…'
    category=CATEGORIES.get(row['slug'],'campus' if row['stage']=='Живу' else 'admission')
    tags=TAGS.get(row['slug'],[])+(['общежитие','общага','заселение'] if row['stage']=='Живу' else [])
    if not tags:tags=[row['stage'],'Московский Политех']
    data={'title':row['title'],'description':description,'category':category,'tags':list(dict.fromkeys(tags)), 'sources':[{'title':'Политех. Выжить и выпуститься — исходный ответ','url':row['url']}]+row['sources'],'reviewedAt':'2026-10-29','status':'needs-review'}
    # JSON values are also valid YAML scalars and sequences; URLs and Cyrillic stay readable.
    front='\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in data.items())
    return '---\n'+front+'\n---\n\n'+notice+'\n\n## Короткий ответ\n\n'+body+'\n'

if __name__=='__main__':
    rows=json.loads(ROOT.joinpath('snapshot.json').read_text())['articles']
    ARTICLES.mkdir(parents=True,exist_ok=True)
    for row in rows:ARTICLES.joinpath('rozb-'+row['slug']+'.md').write_text(convert(row))
    print(f'Converted {len(rows)} articles to {ARTICLES}')
