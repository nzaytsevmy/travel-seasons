from decimal import Decimal, ROUND_HALF_UP
# Official CBR XML_daily.asp?date_req=25/10/2026, response date24.10.2026.
rates={'GEL':Decimal('31.0084'),'USD':Decimal('80.5381'),'EUR':Decimal('90.2429')}
for currency, amount in [('GEL','30000'),('GEL','1000'),('GEL','5000'),('EUR','50000'),('EUR','100000'),('EUR','250'),('EUR','300'),('USD','50'),('EUR','50')]:
    rub=rates[currency]*Decimal(amount)
    print(currency,amount,'RUB',rub.quantize(Decimal('.01'),rounding=ROUND_HALF_UP))
# Hypothetical agreed cost / per-event unconditional deductible, same currency.
for bill in map(Decimal,['35','120']):
    deductible=Decimal('50')
    own=min(bill,deductible)
    insurer=max(Decimal(0),bill-deductible)
    assert own+insurer==bill
    print('hypothetical',bill,'own',own,'insurer',insurer)
assert Decimal('30000')*rates['GEL']==Decimal('930252.0000')
