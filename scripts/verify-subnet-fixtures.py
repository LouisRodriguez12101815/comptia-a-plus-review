"""Independent Python stdlib oracle. No game engine/JavaScript imports."""
import csv
import ipaddress
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
data = json.loads((root / 'content/subnet-architect.json').read_text())
for e in [*data['exercises'], data['transferExercise']]:
    ip = ipaddress.IPv4Address(e['ip'])
    n = ipaddress.IPv4Network(f"{e['ip']}/{e['prefix']}", strict=False)
    expected = dict(network=str(n.network_address), mask=str(n.netmask), broadcast=str(n.broadcast_address), first=str(n.network_address + 1), last=str(n.broadcast_address - 1), capacity=n.num_addresses - 2, isHost=n.network_address < ip < n.broadcast_address, blockSize=2 ** (8-e['prefix'] % 8) if e['prefix'] % 8 else 256, blockOctet=e['prefix']//8+1)
    assert expected == e['expected'], e['id']
for m in data['missions']:
    parent = ipaddress.ip_network(m['parent'])
    blocks = []
    for req, fixture in zip(m['requirements'], m['verifiedFixture'], strict=True):
        n = ipaddress.ip_network(fixture['cidr'], strict=True)
        assert n.subnet_of(parent) and n.num_addresses - 2 >= req['hosts']
        assert not any(n.overlaps(b) for b in blocks)
        if req['kind'] == 'link':
            assert n.prefixlen == 30
        for key, value in dict(mask=str(n.netmask), broadcast=str(n.broadcast_address), first=str(n.network_address+1), last=str(n.broadcast_address-1), capacity=n.num_addresses-2).items():
            assert fixture[key] == value, (m['id'], req['id'], key)
        blocks.append(n)
rows = list(csv.DictReader((root / 'content/sources/vlsm-starter-candidate.csv').open()))
for row, fixture in zip(rows, data['missions'][0]['verifiedFixture'], strict=True):
    for key, dest in [('cidr','cidr'), ('mask','mask'), ('broadcast','broadcast'), ('first_usable','first'), ('last_usable','last'), ('usable_capacity','capacity')]:
        assert row[key] == str(fixture[dest]), key
print(f"PASS: {len(data['exercises'])} source exercises, one detective transfer, both VLSM layouts and every starter CSV field independently verified by Python ipaddress.")
