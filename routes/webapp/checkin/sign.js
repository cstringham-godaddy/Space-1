var style = require('./../../../lib/style.js');
var slackClient = require('../../../slack-client');
var mailerClient = require('../../../mailer-client');
var twilioClient = require('../../../twilio-client');

exports.get = function(req, res, next) {
    var business = req.session.business;

    //TODO: Verify that there are results and no errors
    res.render('checkin/sign', {
        disclosure: business.disclosure,
        companyName: business.companyName,
        bg: business.style.bg,
        logo: business.logo,
        buttonBg: style.rgbObjectToCSS(business.style.buttonBg),
        buttonText: style.rgbObjectToCSS(business.style.buttonText),
        containerText: style.rgbObjectToCSS(business.style.containerText),
        containerBg: style.rgbObjectToCSS(business.style.containerBg)
    });
};

exports.post = function (req, res, next) {
    var sig = req.body.sig.trim();
    if (sig === '') {
        var business = req.session.business;

        res.render('checkin/sign', {
            disclosure: business.disclosure,
            error: 'You must provide a signature',
            companyName: business.companyName,
            bg: business.style.bg,
            logo: business.logo,
            buttonBg: style.rgbObjectToCSS(business.style.buttonBg),
            buttonText: style.rgbObjectToCSS(business.style.buttonText),
            containerText: style.rgbObjectToCSS(business.style.containerText),
            containerBg: style.rgbObjectToCSS(business.style.containerBg)
        });
    } else {
        //Update the state of the appointment
        req.db.get('appointments').updateById(req.session.appointmentId, {
            $set: {
                state: 'checkedIn'
            }
        }, function (err) {
            if (err) {
                return next(err);
            }
            var messageBody = req.session.patientFirstName + ' ' + req.session.patientLastName + ' has checked in!';
            mailerClient.sendSimpleEmail('michael.chang25@gmail.com', 'New Checkin!', messageBody);
            twilioClient.sendSmsToPhoneNumber('+16508623873', messageBody);
            slackClient.sendSlackMessage('#messages', 'Receptionist Administrator', messageBody);
            res.redirect('done');
        });
    }
};
