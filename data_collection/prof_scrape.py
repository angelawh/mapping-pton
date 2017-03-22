# Scrapes Princeton's directory page to get all professors
# (or at least all people with titles containing "professor" and "lecturer")
# prints out a json line-by-line dictonary per professor that contains all of the fields in
# getblankdict() -- if it doesn't contain that field, then it will be an empty string

from lxml import html
import requests
import json
import sys
from string import ascii_lowercase
import re

def getblankdict():
	prof = {}
	prof["name"] = ""
	prof["title"] = ""
	prof["dept"] = ""
	prof["addr"] = ""
	prof["mail"] = ""
	prof["phone"] = ""
	prof["email"] = ""
	prof["voice"] = ""
	prof["netid"] = ""
	prof["fax"] = ""
	prof["url"] = ""
	prof["id"] = ""
	return prof

def parsepage(url):
	page = requests.get(url)
	tree = html.fromstring(page.content)

	#vcards = tree.xpath('//div[@class="entry vcard"]/text()')
	vcards = tree.xpath("//div[contains(@class, 'entry vcard')]") 

	for vcard in vcards:
		field = vcard.find_class("field")
		prof = getblankdict()
		for i in range(0, len(field)):
			key = field[i].find_class("key")
			if len(key) < 1:
				continue
			info_type = key[0].text_content()
			text = field[i].text_content()

			if (info_type == 'Name:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["name"] = text
			elif (info_type == 'Title:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["title"] = text
			elif (info_type == 'Dept:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["dept"] = text
			elif (info_type == 'Addr:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["addr"] = text
			elif (info_type == 'Mail:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["mail"] = text
			elif (info_type == 'Phone:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["phone"] = text
			elif (info_type == 'E-Mail:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["email"] = text
			elif (info_type == 'Voice:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["voice"] = text
			elif (info_type == 'Netid:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["netid"] = text
			elif (info_type == 'Fax:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["fax"] = text
			elif (info_type == 'URL:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["url"] = text
			elif (info_type == 'Id #:'):
				text = text[len(info_type):]
				text = text.strip()
				prof["id"] = text

		if (prof["name"] != ""):
			json.dump(prof, sys.stdout, encoding='utf-8')
			print

def getnumresults(url):
	page = requests.get(url)
	tree = html.fromstring(page.content)

	res = tree.xpath("//div[contains(@class, 'results-nav')]")
	if (len(res) == 0):
		return 1

	pg_str = res[0].text_content()
	nums = [int(s) for s in re.findall(r'\d+', pg_str)]
	max_num = 0
	for num in nums:
		if num > max_num:
			max_num = num

	return max_num



def main():
	titles = ["professor", "lecturer"]

	for title in titles:
		for c in ascii_lowercase:
			first_url = "http://search.princeton.edu/search/index/ff/c/f//af/c/a//lf/b/l/%s/pf/c/p//tf/c/t/%s/faf/c/fa//df/c/d//ef/c/e//submit/submit/page/%s" %(c, title, "1")
			num_pages = getnumresults(first_url)

			# A check to see if we may have reached the 200 results limit -- need to manually search the output for this to ensure
			if (num_pages == 10):
				print "OH NO!!!!!!!!!"
				print c
			
			for page in range(0, num_pages):
				url = "http://search.princeton.edu/search/index/ff/c/f//af/c/a//lf/b/l/%s/pf/c/p//tf/c/t/%s/faf/c/fa//df/c/d//ef/c/e//submit/submit/page/%d" %(c, title, page)
				parsepage(url)

main()

